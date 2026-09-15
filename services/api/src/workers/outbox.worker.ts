import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { RidesGateway } from '../gateway/rides.gateway';

@Injectable()
export class OutboxWorker {
    private readonly logger = new Logger(OutboxWorker.name);
    private isProcessing = false;

    constructor(
        @Inject(DATABASE_POOL) private readonly pool: Pool,
        private readonly gateway: RidesGateway,
    ) { }

    /**
     * Executa a cada segundo para processar os eventos não enviados.
     * O padrão Outbox isola a gravação no BD (atômica) da notificação (disparo para WebSocket/Push).
     */
    @Cron(CronExpression.EVERY_SECOND)
    async processOutboxEvents() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        const client = await this.pool.connect();
        try {
            // Buscar até 100 eventos não processados, com SKIP LOCKED para evitar colisão se escalarmos para múltiplas instâncias da API
            const result = await client.query(`
        SELECT id, event_type, payload, ride_id, created_at 
        FROM outbox_events 
        WHERE status = 'pending' 
        ORDER BY created_at ASC 
        LIMIT 100 
        FOR UPDATE SKIP LOCKED
      `);

            if (result.rows.length === 0) {
                this.isProcessing = false;
                client.release();
                return;
            }

            this.logger.debug(`Processando ${result.rows.length} evento(s) pendente(s) da fila...`);

            for (const event of result.rows) {
                try {
                    const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;

                    switch (event.event_type) {
                        case 'ride.requested':
                            // Aqui emitiríamos para uma fila RabbitMQ se precisasse, mas para simplificar vamos apenas notificar clients (socket) admin etc
                            this.gateway.emitToAll('ride:new_request', payload);
                            break;

                        case 'ride.driver_assigned':
                            // Notificar o passageiro que o motorista foi atribuído
                            if (payload.rideId) {
                                this.gateway.emitToRide(payload.rideId, 'ride:driver_assigned', payload);
                            }
                            break;

                        case 'ride.started':
                            if (payload.rideId) {
                                this.gateway.emitToRide(payload.rideId, 'ride:started', payload);
                            }
                            break;

                        case 'ride.completed':
                            if (payload.rideId) {
                                this.gateway.emitToRide(payload.rideId, 'ride:completed', payload);
                            }
                            break;

                        default:
                            this.logger.warn(`Tipo de evento não tratado no Gateway: ${event.event_type}`);
                    }

                    // Marcar como processado
                    await client.query(`
            UPDATE outbox_events 
            SET status = 'processed', processed_at = NOW() 
            WHERE id = $1
          `, [event.id]);

                } catch (eventError) {
                    this.logger.error(`Erro ao processar evento outbox ${event.id}:`, eventError);
                    // Em um projeto real: marcar como "failed" e implementar retry logic
                    await client.query(`
            UPDATE outbox_events 
            SET status = 'failed' 
            WHERE id = $1
          `, [event.id]);
                }
            }

        } catch (error) {
            this.logger.error('Falha geral no Outbox Worker', error);
        } finally {
            client.release();
            this.isProcessing = false;
        }
    }
}
