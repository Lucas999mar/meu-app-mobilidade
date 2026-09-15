import { Module, Global, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export const DATABASE_POOL = 'DATABASE_POOL';

@Global()
@Module({
    providers: [
        {
            provide: DATABASE_POOL,
            useFactory: (configService: ConfigService) => {
                const pool = new Pool({
                    host: configService.get('DB_HOST', 'localhost'),
                    port: configService.get<number>('DB_PORT', 5432),
                    database: configService.get('DB_NAME', 'mobilidade_regional'),
                    user: configService.get('DB_USER', 'postgres'),
                    password: configService.get('DB_PASSWORD', 'postgres'),
                    max: 20,
                    idleTimeoutMillis: 30000,
                    connectionTimeoutMillis: 5000,
                });
                return pool;
            },
            inject: [ConfigService],
        },
    ],
    exports: [DATABASE_POOL],
})
export class DatabaseModule implements OnModuleInit {
    private readonly logger = new Logger(DatabaseModule.name);

    constructor(
        @Inject(DATABASE_POOL) private readonly pool: Pool,
    ) { }

    async onModuleInit() {
        try {
            const client = await this.pool.connect();
            const result = await client.query('SELECT NOW()');
            client.release();
            this.logger.log(`✅ PostgreSQL conectado: ${result.rows[0].now}`);
        } catch (error) {
            this.logger.error('❌ Falha na conexão com PostgreSQL:', error);
        }
    }
}
