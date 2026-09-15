import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config();

const logger = new Logger('DatabaseSeed');

async function seed() {
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'mobilidade_regional',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    });

    try {
        const seedsDir = path.join(__dirname, 'seeds');
        const files = fs.readdirSync(seedsDir).sort();

        for (const file of files) {
            if (file.endsWith('.sql')) {
                logger.log(`Aplicando seed fictício: ${file}...`);
                const filePath = path.join(seedsDir, file);
                const sql = fs.readFileSync(filePath, 'utf-8');
                await pool.query(sql);
                logger.log(`✅ Seed ${file} concluído!`);
            }
        }
    } catch (error) {
        logger.error('❌ Erro no seed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seed();
