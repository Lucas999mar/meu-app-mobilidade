import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function runMigrations() {
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'mobilidade_regional',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    });

    const client = await pool.connect();

    try {
        // Criar tabela de controle de migrations
        await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

        const migrationsDir = path.join(__dirname, 'migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of files) {
            const { rows } = await client.query(
                'SELECT 1 FROM _migrations WHERE name = $1', [file]
            );

            if (rows.length === 0) {
                console.log(`📦 Executando migration: ${file}`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                await client.query(sql);
                await client.query(
                    'INSERT INTO _migrations (name) VALUES ($1)', [file]
                );
                console.log(`✅ Migration concluída: ${file}`);
            } else {
                console.log(`⏭  Migration já aplicada: ${file}`);
            }
        }

        console.log('\n🎉 Todas as migrations foram executadas!');
    } catch (error) {
        console.error('❌ Erro na migration:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations();
