import { Injectable, Logger, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

@Injectable()
export class QualityService {
    private readonly logger = new Logger(QualityService.name);

    constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) { }

    async getSystemMetrics() {
        this.logger.log(`[ETAPA 8] Extraindo métricas de qualidade de serviço.`);
        return {
            activeRides: 12,
            averageAcceptTimeMs: 450, // milissegundos
            errorRate: 0.01 // 1%
        };
    }
}
