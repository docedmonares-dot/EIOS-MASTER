const pool = require("../config/database");

exports.getSystemHealth = async (_req, res) => {
    const checkedAt = new Date();

    try {
        const result = await pool.query(`
            SELECT
                NOW() AS database_time,
                pg_database_size(current_database()) AS database_size_bytes
        `);
        const database = result.rows[0];

        return res.json({
            success: true,
            checked_at: checkedAt,
            api: {
                status: "ONLINE",
                uptime_seconds: Math.floor(process.uptime()),
                node_version: process.version
            },
            database: {
                status: "ONLINE",
                database_time: database.database_time,
                size_bytes: Number(database.database_size_bytes)
            }
        });
    } catch (error) {
        console.error("SYSTEM HEALTH ERROR:", error);
        return res.status(503).json({
            success: false,
            checked_at: checkedAt,
            api: { status: "ONLINE" },
            database: { status: "OFFLINE" },
            message: "The database health check failed."
        });
    }
};
