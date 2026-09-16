const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sql = fs.readFileSync(path.join(__dirname, '../../INIT_DATABASE_PRODUCTION.sql'), 'utf-8');

pool.query(sql).then(() => {
    console.log("Database initialized successfully!");
    process.exit(0);
}).catch(err => {
    console.error("Warning: DB init script threw an error (might already exist):", err.message);
    process.exit(0);
});
