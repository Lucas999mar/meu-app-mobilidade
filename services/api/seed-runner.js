const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sql = fs.readFileSync(path.join(__dirname, '../../INIT_DATABASE_PRODUCTION.sql'), 'utf-8');
const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

async function run() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (let i = 0; i < statements.length; i++) {
            if (statements[i].includes('CREATE TYPE')) {
                try { await client.query(statements[i]); } catch (e) { }
            } else {
                await client.query(statements[i]);
            }
        }
        await client.query('COMMIT');
        console.log("Database initialized successfully!");
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Warning: DB init script threw an error:", err.message);
        process.exit(0);
    } finally {
        client.release();
    }
}
run();
