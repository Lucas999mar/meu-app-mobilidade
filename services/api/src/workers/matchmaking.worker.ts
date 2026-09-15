import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { RidesService } from '../rides/rides.service';

@Injectable()
export class MatchmakingWorker {
    private readonly logger = new Logger(MatchmakingWorker.name);
    private isProcessing = false;

    constructor(
        @Inject(DATABASE_POOL) private readonly pool: Pool,
        private readonly ridesService: RidesService,
    ) { }

    /**
     * Executa a cada 10 segundos
     * Verifica corridas que estão 'searching_driver' e tenta dispará-las Novamente 
     * se as ofertas antigas expiraram ou foram ignoradas.
     */
    @Cron('*/10 * * * * *')
    async processMatchmaking() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // Procurar corridas buscando motorista
            // que NÃO possuem nenhuma oferta pending
            const ridesResult = await this.pool.query(`
        SELECT r.id, r.created_at
        FROM rides r
        WHERE r.status = 'searching_driver'
        AND NOT EXISTS (
           SELECT 1 FROM ride_offers ro 
           WHERE ro.ride_id = r.id AND ro.status = 'pending' AND ro.expires_at > NOW()
        )
      `);

            if (ridesResult.rows.length === 0) {
                this.isProcessing = false;
                return;
            }

            this.logger.log(`🔎 Matchmaking encontrou ${ridesResult.rows.length} corridas sem ofertas ativas. Reparando-as...`);

            for (const ride of ridesResult.rows) {
                // Checar se a corrida passou muito tempo buscando (ex: 5 minutos)
                const rideAgeMs = Date.now() - new Date(ride.created_at).getTime();
                const maxSearchTimeMs = 5 * 60 * 1000;

                if (rideAgeMs > maxSearchTimeMs) {
                    // Timeout
                    this.logger.warn(`⏰ Corrida ${ride.id} atingiu limite de busca. Encerrando-a.`);
                    await this.pool.query(`
             UPDATE rides SET status = 'no_driver', updated_at = NOW() 
             WHERE id = $1 AND status = 'searching_driver'
          `, [ride.id]);

                    await this.pool.query(`
             INSERT INTO ride_events (ride_id, event_type, data) 
             VALUES ($1, 'search_timeout', '{}')
          `, [ride.id]);
                    continue;
                }

                // Caso contrário, tenta realizar um novo despacho
                try {
                    const dispatch = await this.ridesService.dispatchRide(ride.id);
                    this.logger.debug(`Redirecionando Corrida ${ride.id}: status=${dispatch.status}`);
                } catch (dispatchError) {
                    this.logger.error(`Falha no re-despacho da corrida ${ride.id}:`, dispatchError);
                }
            }

        } catch (error) {
            this.logger.error('Falha geral no Matchmaking Worker', error);
        } finally {
            this.isProcessing = false;
        }
    }
}
