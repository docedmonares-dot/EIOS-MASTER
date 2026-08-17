const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const db = require("../src/config/database");

const migrationsDirectory = path.resolve(__dirname, "../../database/migrations");
const command = process.argv[2] || "status";

function migrations() {
    return fs.readdirSync(migrationsDirectory)
        .filter((name) => name.endsWith(".sql"))
        .sort((left, right) => left.localeCompare(right, "en", { numeric: true }))
        .map((name) => {
            const sql = fs.readFileSync(path.join(migrationsDirectory, name), "utf8");
            return {
                name,
                sql,
                checksum: crypto.createHash("sha256").update(sql).digest("hex")
            };
        });
}

async function ensureJournal() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS eios_schema_migrations (
            migration_name VARCHAR(255) PRIMARY KEY,
            checksum_sha256 CHAR(64) NOT NULL,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            execution_mode VARCHAR(20) NOT NULL DEFAULT 'migrate'
                CHECK (execution_mode IN ('migrate', 'baseline'))
        )
    `);
}

async function appliedMigrations() {
    const result = await db.query(`
        SELECT migration_name, checksum_sha256, applied_at, execution_mode
        FROM eios_schema_migrations
        ORDER BY migration_name
    `);
    return new Map(result.rows.map((row) => [row.migration_name, row]));
}

function verifyChecksums(items, applied) {
    for (const item of items) {
        const record = applied.get(item.name);
        if (record && record.checksum_sha256 !== item.checksum) {
            throw new Error(`Applied migration checksum changed: ${item.name}`);
        }
    }
}

async function status(items, applied) {
    console.table(items.map((item) => ({
        migration: item.name,
        status: applied.has(item.name) ? "APPLIED" : "PENDING",
        mode: applied.get(item.name)?.execution_mode || "—"
    })));
    console.log(`${applied.size} applied; ${items.length - applied.size} pending.`);
}

async function baseline(items, applied) {
    for (const item of items) {
        if (applied.has(item.name)) continue;
        await db.query(
            `INSERT INTO eios_schema_migrations
             (migration_name, checksum_sha256, execution_mode)
             VALUES ($1, $2, 'baseline')`,
            [item.name, item.checksum]
        );
        console.log(`BASELINED ${item.name}`);
    }
}

async function migrate(items, applied) {
    for (const item of items) {
        if (applied.has(item.name)) continue;
        const client = await db.connect();
        try {
            await client.query("BEGIN");
            await client.query(item.sql);
            await client.query(
                `INSERT INTO eios_schema_migrations
                 (migration_name, checksum_sha256, execution_mode)
                 VALUES ($1, $2, 'migrate')`,
                [item.name, item.checksum]
            );
            await client.query("COMMIT");
            console.log(`APPLIED ${item.name}`);
        } catch (error) {
            await client.query("ROLLBACK");
            throw new Error(`Migration failed: ${item.name}: ${error.message}`);
        } finally {
            client.release();
        }
    }
}

async function main() {
    if (!["status", "migrate", "baseline"].includes(command)) {
        throw new Error("Usage: node scripts/run-migrations.js [status|migrate|baseline]");
    }

    await ensureJournal();
    const items = migrations();
    const applied = await appliedMigrations();
    verifyChecksums(items, applied);

    if (command === "status") await status(items, applied);
    if (command === "baseline") await baseline(items, applied);
    if (command === "migrate") await migrate(items, applied);
}

main()
    .then(() => db.end())
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
        db.end();
    });
