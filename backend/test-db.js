require('dotenv').config();
const pool = require('./src/config/db');

async function testConnection() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log("🟢 DB CONNECTION SUCCESS");
        console.log(res.rows);
        process.exit();
    } catch (err) {
        console.error("🔴 DB CONNECTION FAILED");
        console.error(err);
        process.exit(1);
    }
}

testConnection();