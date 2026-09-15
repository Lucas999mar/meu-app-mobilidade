import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { Inject } from '@nestjs/common';
import { DATABASE_POOL } from '../database/database.module';

@Injectable()
export class SupportService {
    private readonly logger = new Logger(SupportService.name);

    constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) { }

    async openTicket(userId: string, rideId: string, subject: string, description: string) {
        this.logger.log(`[ETAPA 6] Novo ticket de suporte criado pelo usuario ${userId}`);
        // Estrutura para Registro do chamado de suporte LGPD e Qualidade
        return { ticketId: 'tick_123', status: 'open' };
    }
}
