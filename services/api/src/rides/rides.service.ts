import {
    Injectable, Inject, BadRequestException,
    ConflictException, NotFoundException, ForbiddenException,
    Logger,
} from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { v4 as uuidv4 } from 'uuid';
import { calculateQuote, TariffConfig } from '../tariffs/tariff-engine';

// Validade das cotações em segundos
const QUOTE_TTL_SECONDS = 120;
// Validade das ofertas em segundos
const OFFER_TTL_SECONDS = 30;
// Raio máximo de busca de motoristas em metros
const MAX_SEARCH_RADIUS_METERS = 10000;

@Injectable()
export class RidesService {
    private readonly logger = new Logger(RidesService.name);

    constructor(
        @Inject(DATABASE_POOL) private readonly pool: Pool,
    ) { }

    /**
     * Cria uma cotação de corrida
     */
    async createQuote(
        customerId: string,
        data: {
            cityId: string;
            categoryId: string;
            originAddress: string;
            originLat: number;
            originLng: number;
            destinationAddress: string;
            destinationLat: number;
            destinationLng: number;
            discountCents?: number;
        },
    ) {
        // Buscar tarifa ativa
        const tariffResult = await this.pool.query(
            `SELECT * FROM tariffs 
       WHERE city_id = $1 AND category_id = $2 AND is_active = TRUE
       ORDER BY priority DESC, version DESC LIMIT 1`,
            [data.cityId, data.categoryId],
        );

        if (tariffResult.rows.length === 0) {
            throw new BadRequestException('Tarifa não encontrada para esta cidade/categoria');
        }

        const tariff = tariffResult.rows[0];

        // Calcular distância e duração via demonstração (Haversine para demo)
        const distanceMeters = this.calculateDistanceHaversine(
            data.originLat, data.originLng,
            data.destinationLat, data.destinationLng,
        );
        // Estimativa: 30km/h em área urbana
        const durationSeconds = Math.round((distanceMeters / 1000 / 30) * 3600);

        const tariffConfig: TariffConfig = {
            baseFare: tariff.base_fare,
            perKm: tariff.per_km,
            perMinute: tariff.per_minute,
            minimumFare: tariff.minimum_fare,
            waitFreeMinutes: tariff.wait_free_minutes,
            waitPerMinute: tariff.wait_per_minute,
            cancellationFee: tariff.cancellation_fee,
            cancellationFreeSeconds: tariff.cancellation_free_seconds,
            platformCommissionRate: parseFloat(tariff.platform_commission_rate),
        };

        const quote = calculateQuote(tariffConfig, {
            distanceMeters,
            durationSeconds,
            dynamicMultiplier: 1.0,
            discountCents: data.discountCents || 0,
        });

        const expiresAt = new Date(Date.now() + QUOTE_TTL_SECONDS * 1000);

        const result = await this.pool.query(
            `INSERT INTO quotes (
        customer_id, city_id, category_id, tariff_id,
        origin_address, origin_lat, origin_lng,
        destination_address, destination_lat, destination_lng,
        distance_meters, duration_seconds,
        base_fare, distance_fare, duration_fare, variable_component,
        minimum_applied, dynamic_multiplier, ride_fare,
        wait_fare, additional_fare, toll_estimate, discount, total_fare,
        expires_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
      RETURNING *`,
            [
                customerId, data.cityId, data.categoryId, tariff.id,
                data.originAddress, data.originLat, data.originLng,
                data.destinationAddress, data.destinationLat, data.destinationLng,
                distanceMeters, durationSeconds,
                quote.baseFare, quote.distanceFare, quote.durationFare,
                quote.variableComponent, quote.minimumApplied,
                quote.dynamicMultiplier, quote.rideFare,
                quote.waitFare, quote.additionalFare, quote.tollEstimate,
                quote.discount, quote.totalFare,
                expiresAt,
            ],
        );

        return {
            ...result.rows[0],
            breakdown: quote.breakdown,
            formattedTotal: `R$ ${(quote.totalFare / 100).toFixed(2)}`,
        };
    }

    /**
     * Solicita uma corrida a partir de uma cotação válida
     */
    async requestRide(
        customerId: string,
        data: {
            quoteId: string;
            paymentMethod: string;
            idempotencyKey: string;
        },
    ) {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            // Verificar idempotência
            const existingRide = await client.query(
                'SELECT * FROM rides WHERE idempotency_key = $1',
                [data.idempotencyKey],
            );

            if (existingRide.rows.length > 0) {
                await client.query('COMMIT');
                return existingRide.rows[0];
            }

            // Buscar cotação
            const quoteResult = await client.query(
                'SELECT * FROM quotes WHERE id = $1 AND customer_id = $2',
                [data.quoteId, customerId],
            );

            if (quoteResult.rows.length === 0) {
                throw new NotFoundException('Cotação não encontrada');
            }

            const quote = quoteResult.rows[0];

            // Verificar validade
            if (new Date(quote.expires_at) < new Date()) {
                throw new BadRequestException('Cotação expirada. Solicite uma nova cotação.');
            }

            // Verificar corrida ativa do cliente (constraint no banco também garante)
            const activeRide = await client.query(
                `SELECT id FROM rides WHERE customer_id = $1 
         AND status IN ('requested', 'searching_driver', 'driver_assigned', 
                        'en_route_pickup', 'arrived_pickup', 'in_ride')`,
                [customerId],
            );

            if (activeRide.rows.length > 0) {
                throw new ConflictException('Você já possui uma corrida ativa');
            }

            // Gerar PIN de 4 dígitos
            const pinCode = Math.floor(1000 + Math.random() * 9000).toString();

            // Buscar versão da tarifa
            const tariffResult = await client.query(
                'SELECT version FROM tariffs WHERE id = $1',
                [quote.tariff_id],
            );

            const rideId = uuidv4();

            // Criar corrida
            const rideResult = await client.query(
                `INSERT INTO rides (
          id, quote_id, customer_id, city_id, category_id,
          status, version, idempotency_key,
          origin_address, origin_lat, origin_lng,
          destination_address, destination_lat, destination_lng,
          distance_meters, duration_seconds,
          contracted_fare, dynamic_multiplier, tariff_version,
          pin_code, payment_method
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
        RETURNING *`,
                [
                    rideId, quote.id, customerId, quote.city_id, quote.category_id,
                    'searching_driver', 1, data.idempotencyKey,
                    quote.origin_address, quote.origin_lat, quote.origin_lng,
                    quote.destination_address, quote.destination_lat, quote.destination_lng,
                    quote.distance_meters, quote.duration_seconds,
                    quote.total_fare, parseFloat(quote.dynamic_multiplier),
                    tariffResult.rows[0]?.version || 1,
                    pinCode, data.paymentMethod,
                ],
            );

            // Registrar evento
            await client.query(
                `INSERT INTO ride_events (ride_id, event_type, ride_version, actor_id, data)
         VALUES ($1, 'ride_requested', 1, $2, $3)`,
                [rideId, customerId, JSON.stringify({ quoteId: quote.id })],
            );

            // Outbox event
            await client.query(
                `INSERT INTO outbox_events (event_type, payload, ride_id)
         VALUES ('ride.requested', $1, $2)`,
                [JSON.stringify(rideResult.rows[0]), rideId],
            );

            await client.query('COMMIT');

            this.logger.log(`🚗 Corrida ${rideId} solicitada por cliente ${customerId}`);

            return rideResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Busca motoristas disponíveis e cria ofertas
     */
    async dispatchRide(rideId: string) {
        const rideResult = await this.pool.query(
            'SELECT * FROM rides WHERE id = $1',
            [rideId],
        );

        if (rideResult.rows.length === 0) {
            throw new NotFoundException('Corrida não encontrada');
        }

        const ride = rideResult.rows[0];

        if (ride.status !== 'searching_driver') {
            throw new BadRequestException('Corrida não está em busca de motorista');
        }

        // Buscar motoristas disponíveis na área
        const driversResult = await this.pool.query(
            `SELECT d.id, d.user_id, d.active_vehicle_id, dl.location,
              ST_Distance(
                dl.location::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
              ) as distance_meters
       FROM drivers d
       JOIN driver_locations dl ON dl.driver_id = d.id
       JOIN vehicles v ON v.id = d.active_vehicle_id
       WHERE d.status = 'approved'
         AND d.availability = 'available'
         AND d.city_id = $3
         AND v.category_id = $4
         AND v.is_approved = TRUE
         AND dl.updated_at > NOW() - INTERVAL '5 minutes'
         AND ST_DWithin(
           dl.location::geography,
           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           $5
         )
       ORDER BY distance_meters ASC
       LIMIT 5`,
            [ride.origin_lng, ride.origin_lat, ride.city_id, ride.category_id, MAX_SEARCH_RADIUS_METERS],
        );

        if (driversResult.rows.length === 0) {
            // Sem motoristas: marcar como no_driver
            await this.pool.query(
                `UPDATE rides SET status = 'no_driver', version = version + 1, updated_at = NOW()
         WHERE id = $1`,
                [rideId],
            );

            await this.pool.query(
                `INSERT INTO ride_events (ride_id, event_type, ride_version, data)
         VALUES ($1, 'no_driver_available', (SELECT version FROM rides WHERE id = $1), '{}')`,
                [rideId],
            );

            return { status: 'no_driver', message: 'Nenhum motorista disponível no momento' };
        }

        // Criar ofertas para os motoristas mais próximos
        const offers = [];
        for (const driver of driversResult.rows) {
            const etaSeconds = Math.round(driver.distance_meters / 500 * 60); // ~30km/h
            const expiresAt = new Date(Date.now() + OFFER_TTL_SECONDS * 1000);

            const offerResult = await this.pool.query(
                `INSERT INTO ride_offers (
          ride_id, driver_id, round, status,
          distance_to_pickup_meters, eta_seconds,
          earnings_estimate, expires_at
        ) VALUES ($1, $2, 1, 'pending', $3, $4, $5, $6)
        RETURNING *`,
                [
                    rideId, driver.id, 1,
                    Math.round(driver.distance_meters),
                    etaSeconds,
                    Math.round(ride.contracted_fare * 0.80), // 80% para motorista
                    expiresAt,
                ],
            );

            offers.push(offerResult.rows[0]);
        }

        this.logger.log(`📡 ${offers.length} ofertas enviadas para corrida ${rideId}`);

        return { status: 'offers_sent', count: offers.length, offers };
    }

    /**
     * Motorista aceita uma oferta (transação atômica)
     */
    async acceptOffer(driverId: string, offerId: string) {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            // Lock na oferta para evitar race condition
            const offerResult = await client.query(
                `SELECT ro.*, r.status as ride_status, r.id as ride_id, r.version as ride_version
         FROM ride_offers ro
         JOIN rides r ON r.id = ro.ride_id
         WHERE ro.id = $1 AND ro.driver_id = $2
         FOR UPDATE OF ro, r`,
                [offerId, driverId],
            );

            if (offerResult.rows.length === 0) {
                throw new NotFoundException('Oferta não encontrada');
            }

            const offer = offerResult.rows[0];

            // Validações
            if (offer.status !== 'pending') {
                throw new ConflictException('Oferta já foi respondida');
            }

            if (new Date(offer.expires_at) < new Date()) {
                throw new BadRequestException('Oferta expirada');
            }

            if (offer.ride_status !== 'searching_driver') {
                throw new ConflictException('Corrida não está mais disponível');
            }

            // Verificar que o motorista não tem outra corrida ativa
            const activeRide = await client.query(
                `SELECT id FROM rides WHERE driver_id = $1 
         AND status IN ('driver_assigned', 'en_route_pickup', 'arrived_pickup', 'in_ride')
         FOR UPDATE`,
                [driverId],
            );

            if (activeRide.rows.length > 0) {
                throw new ConflictException('Você já possui uma corrida ativa');
            }

            // Buscar veículo ativo do motorista
            const driverResult = await client.query(
                'SELECT active_vehicle_id FROM drivers WHERE id = $1',
                [driverId],
            );

            const newVersion = offer.ride_version + 1;

            // Aceitar oferta
            await client.query(
                `UPDATE ride_offers SET status = 'accepted', responded_at = NOW()
         WHERE id = $1`,
                [offerId],
            );

            // Atribuir motorista à corrida
            await client.query(
                `UPDATE rides SET 
          status = 'driver_assigned',
          driver_id = $1,
          vehicle_id = $2,
          driver_assigned_at = NOW(),
          version = $3,
          updated_at = NOW()
         WHERE id = $4`,
                [driverId, driverResult.rows[0].active_vehicle_id, newVersion, offer.ride_id],
            );

            // Mudar disponibilidade do motorista
            await client.query(
                "UPDATE drivers SET availability = 'reserved' WHERE id = $1",
                [driverId],
            );

            // Retirar outras ofertas da mesma corrida
            await client.query(
                `UPDATE ride_offers SET status = 'withdrawn', responded_at = NOW()
         WHERE ride_id = $1 AND id != $2 AND status = 'pending'`,
                [offer.ride_id, offerId],
            );

            // Evento
            await client.query(
                `INSERT INTO ride_events (ride_id, event_type, ride_version, actor_id, data)
         VALUES ($1, 'driver_accepted', $2, $3, $4)`,
                [offer.ride_id, newVersion, driverId,
                JSON.stringify({ offerId, driverId })],
            );

            // Outbox
            await client.query(
                `INSERT INTO outbox_events (event_type, payload, ride_id)
         VALUES ('ride.driver_assigned', $1, $2)`,
                [JSON.stringify({ rideId: offer.ride_id, driverId, offerId }), offer.ride_id],
            );

            await client.query('COMMIT');

            this.logger.log(`✅ Motorista ${driverId} aceitou corrida ${offer.ride_id}`);

            // Retornar corrida atualizada
            const updatedRide = await this.pool.query(
                `SELECT r.*, u.name as driver_name, u.phone as driver_phone,
                v.brand, v.model, v.color, v.plate, v.year
         FROM rides r
         LEFT JOIN drivers d ON d.id = r.driver_id
         LEFT JOIN users u ON u.id = d.user_id
         LEFT JOIN vehicles v ON v.id = r.vehicle_id
         WHERE r.id = $1`,
                [offer.ride_id],
            );

            return updatedRide.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Motorista informa chegada ao ponto de embarque
     */
    async arriveAtPickup(rideId: string, driverId: string) {
        return this.updateRideStatus(rideId, driverId, 'arrived_pickup', 'en_route_pickup', 'driver_arrived');
    }

    /**
     * Iniciar viagem (valida PIN)
     */
    async startRide(rideId: string, driverId: string, pinCode: string) {
        const ride = await this.getRideForDriver(rideId, driverId);

        if (ride.status !== 'arrived_pickup') {
            throw new BadRequestException('O motorista precisa informar a chegada primeiro');
        }

        if (ride.pin_code !== pinCode) {
            throw new ForbiddenException('PIN incorreto');
        }

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const newVersion = ride.version + 1;
            await client.query(
                `UPDATE rides SET status = 'in_ride', started_at = NOW(), 
         version = $1, updated_at = NOW() WHERE id = $2`,
                [newVersion, rideId],
            );

            await client.query(
                "UPDATE drivers SET availability = 'in_ride' WHERE id = $1",
                [driverId],
            );

            await client.query(
                `INSERT INTO ride_events (ride_id, event_type, ride_version, actor_id)
         VALUES ($1, 'ride_started', $2, $3)`,
                [rideId, newVersion, driverId],
            );

            await client.query(
                `INSERT INTO outbox_events (event_type, payload, ride_id)
         VALUES ('ride.started', $1, $2)`,
                [JSON.stringify({ rideId }), rideId],
            );

            await client.query('COMMIT');

            this.logger.log(`🚀 Corrida ${rideId} iniciada!`);
            return this.getRideById(rideId);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Concluir corrida
     */
    async completeRide(rideId: string, driverId: string) {
        const ride = await this.getRideForDriver(rideId, driverId);

        if (ride.status !== 'in_ride') {
            throw new BadRequestException('Corrida não está em andamento');
        }

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const newVersion = ride.version + 1;

            // Usar o valor contratado como tarifa final
            const finalFare = ride.contracted_fare;
            const tollFare = ride.toll_fare || 0;
            const discount = ride.discount || 0;
            const totalCharged = finalFare;

            await client.query(
                `UPDATE rides SET 
          status = 'completed', completed_at = NOW(),
          final_distance_meters = distance_meters,
          final_duration_seconds = duration_seconds,
          final_fare = $1, total_charged = $2,
          version = $3, updated_at = NOW()
         WHERE id = $4`,
                [finalFare, totalCharged, newVersion, rideId],
            );

            // Liberar motorista
            await client.query(
                "UPDATE drivers SET availability = 'available' WHERE id = $1",
                [driverId],
            );

            // Buscar comissão
            const driverResult = await this.pool.query(
                'SELECT commission_rate FROM drivers WHERE id = $1',
                [driverId],
            );
            const commissionRate = parseFloat(driverResult.rows[0].commission_rate);

            // Lançamentos financeiros
            const platformCommission = Math.round(finalFare * commissionRate);
            const driverEarning = finalFare - platformCommission;

            // Débito ao passageiro (total cobrado)
            await client.query(
                `INSERT INTO ledger_entries (ride_id, entry_type, description, debit, user_id)
         VALUES ($1, 'ride_fare', 'Tarifa da corrida', $2, $3)`,
                [rideId, totalCharged, ride.customer_id],
            );

            // Crédito comissão plataforma
            await client.query(
                `INSERT INTO ledger_entries (ride_id, entry_type, description, credit)
         VALUES ($1, 'platform_commission', 'Comissão da plataforma', $2)`,
                [rideId, platformCommission],
            );

            // Crédito motorista
            const driverUserId = (await client.query(
                'SELECT user_id FROM drivers WHERE id = $1', [driverId]
            )).rows[0].user_id;

            await client.query(
                `INSERT INTO ledger_entries (ride_id, entry_type, description, credit, user_id)
         VALUES ($1, 'driver_earning', 'Ganho do motorista', $2, $3)`,
                [rideId, driverEarning, driverUserId],
            );

            // Evento
            await client.query(
                `INSERT INTO ride_events (ride_id, event_type, ride_version, actor_id, data)
         VALUES ($1, 'ride_completed', $2, $3, $4)`,
                [rideId, newVersion, driverId,
                    JSON.stringify({ finalFare, platformCommission, driverEarning })],
            );

            // Outbox
            await client.query(
                `INSERT INTO outbox_events (event_type, payload, ride_id)
         VALUES ('ride.completed', $1, $2)`,
                [JSON.stringify({ rideId, totalCharged, driverEarning }), rideId],
            );

            await client.query('COMMIT');

            this.logger.log(`🏁 Corrida ${rideId} concluída! Total: R$ ${(totalCharged / 100).toFixed(2)}`);

            return {
                ride: await this.getRideById(rideId),
                receipt: {
                    totalCharged: totalCharged,
                    formattedTotal: `R$ ${(totalCharged / 100).toFixed(2)}`,
                    platformCommission,
                    driverEarning,
                    formattedDriverEarning: `R$ ${(driverEarning / 100).toFixed(2)}`,
                },
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Cancelar corrida
     */
    async cancelRide(rideId: string, userId: string, reason: string) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const rideResult = await client.query(
                'SELECT * FROM rides WHERE id = $1 FOR UPDATE',
                [rideId],
            );

            if (rideResult.rows.length === 0) {
                throw new NotFoundException('Corrida não encontrada');
            }

            const ride = rideResult.rows[0];
            const cancellableStatuses = [
                'requested', 'searching_driver', 'driver_assigned',
                'en_route_pickup', 'arrived_pickup',
            ];

            if (!cancellableStatuses.includes(ride.status)) {
                throw new BadRequestException('Corrida não pode ser cancelada neste estado');
            }

            const newVersion = ride.version + 1;

            await client.query(
                `UPDATE rides SET 
          status = 'cancelled', cancelled_at = NOW(),
          cancelled_by = $1, cancellation_reason = $2,
          version = $3, updated_at = NOW()
         WHERE id = $4`,
                [userId, reason, newVersion, rideId],
            );

            // Liberar motorista se atribuído
            if (ride.driver_id) {
                await client.query(
                    "UPDATE drivers SET availability = 'available' WHERE id = $1",
                    [ride.driver_id],
                );
            }

            // Retirar ofertas pendentes
            await client.query(
                `UPDATE ride_offers SET status = 'withdrawn' 
         WHERE ride_id = $1 AND status = 'pending'`,
                [rideId],
            );

            await client.query(
                `INSERT INTO ride_events (ride_id, event_type, ride_version, actor_id, data)
         VALUES ($1, 'ride_cancelled', $2, $3, $4)`,
                [rideId, newVersion, userId, JSON.stringify({ reason })],
            );

            await client.query('COMMIT');

            this.logger.log(`❌ Corrida ${rideId} cancelada. Motivo: ${reason}`);
            return this.getRideById(rideId);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // === Helpers ===

    async getRideById(rideId: string) {
        const result = await this.pool.query(
            `SELECT r.*, 
              cu.name as customer_name, cu.phone as customer_phone,
              du.name as driver_name, du.phone as driver_phone,
              v.brand, v.model, v.color, v.plate, v.year,
              cat.display_name as category_name
       FROM rides r
       LEFT JOIN customers c ON c.id = r.customer_id
       LEFT JOIN users cu ON cu.id = c.user_id
       LEFT JOIN drivers d ON d.id = r.driver_id
       LEFT JOIN users du ON du.id = d.user_id
       LEFT JOIN vehicles v ON v.id = r.vehicle_id
       LEFT JOIN categories cat ON cat.id = r.category_id
       WHERE r.id = $1`,
            [rideId],
        );
        return result.rows[0] || null;
    }

    async getRideForDriver(rideId: string, driverId: string) {
        const result = await this.pool.query(
            'SELECT * FROM rides WHERE id = $1 AND driver_id = $2',
            [rideId, driverId],
        );
        if (result.rows.length === 0) {
            throw new NotFoundException('Corrida não encontrada ou não atribuída a você');
        }
        return result.rows[0];
    }

    async getActiveRideForCustomer(customerId: string) {
        const result = await this.pool.query(
            `SELECT r.*, du.name as driver_name, v.brand, v.model, v.color, v.plate
       FROM rides r
       LEFT JOIN drivers d ON d.id = r.driver_id
       LEFT JOIN users du ON du.id = d.user_id
       LEFT JOIN vehicles v ON v.id = r.vehicle_id
       WHERE r.customer_id = $1
         AND r.status IN ('requested','searching_driver','driver_assigned',
                          'en_route_pickup','arrived_pickup','in_ride')
       ORDER BY r.created_at DESC LIMIT 1`,
            [customerId],
        );
        return result.rows[0] || null;
    }

    async getRideHistory(userId: string, role: string, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        let query: string;

        if (role === 'customer') {
            query = `SELECT r.*, cat.display_name as category_name
               FROM rides r
               JOIN customers c ON c.id = r.customer_id
               JOIN categories cat ON cat.id = r.category_id
               WHERE c.user_id = $1
               ORDER BY r.created_at DESC
               LIMIT $2 OFFSET $3`;
        } else if (role === 'driver') {
            query = `SELECT r.*, cat.display_name as category_name
               FROM rides r
               JOIN drivers d ON d.id = r.driver_id
               JOIN categories cat ON cat.id = r.category_id
               WHERE d.user_id = $1
               ORDER BY r.created_at DESC
               LIMIT $2 OFFSET $3`;
        } else {
            // Admin: todas as corridas
            query = `SELECT r.*, cat.display_name as category_name,
                      cu.name as customer_name, du.name as driver_name
               FROM rides r
               JOIN categories cat ON cat.id = r.category_id
               LEFT JOIN customers c ON c.id = r.customer_id
               LEFT JOIN users cu ON cu.id = c.user_id
               LEFT JOIN drivers d ON d.id = r.driver_id
               LEFT JOIN users du ON du.id = d.user_id
               ORDER BY r.created_at DESC
               LIMIT $2 OFFSET $3`;
            return (await this.pool.query(query, [limit, offset])).rows;
        }

        return (await this.pool.query(query, [userId, limit, offset])).rows;
    }

    private updateRideStatus(
        rideId: string, driverId: string,
        newStatus: string, expectedStatus: string, eventType: string,
    ) {
        return this.pool.connect().then(async (client: PoolClient) => {
            try {
                await client.query('BEGIN');

                const ride = await client.query(
                    'SELECT * FROM rides WHERE id = $1 AND driver_id = $2 FOR UPDATE',
                    [rideId, driverId],
                );

                if (ride.rows.length === 0) {
                    throw new NotFoundException('Corrida não encontrada');
                }

                if (ride.rows[0].status !== expectedStatus && ride.rows[0].status !== 'driver_assigned') {
                    throw new BadRequestException(`Estado inválido: ${ride.rows[0].status}`);
                }

                const newVersion = ride.rows[0].version + 1;

                const field = newStatus === 'arrived_pickup' ? 'arrived_at' : 'updated_at';
                await client.query(
                    `UPDATE rides SET status = $1, ${field} = NOW(), version = $2, updated_at = NOW()
           WHERE id = $3`,
                    [newStatus, newVersion, rideId],
                );

                if (newStatus === 'en_route_pickup') {
                    await client.query(
                        "UPDATE drivers SET availability = 'en_route' WHERE id = $1",
                        [driverId],
                    );
                }

                await client.query(
                    `INSERT INTO ride_events (ride_id, event_type, ride_version, actor_id)
           VALUES ($1, $2, $3, $4)`,
                    [rideId, eventType, newVersion, driverId],
                );

                await client.query('COMMIT');
                return this.getRideById(rideId);
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        });
    }

    /**
     * Haversine — para demonstração local sem API de mapas
     */
    private calculateDistanceHaversine(
        lat1: number, lng1: number, lat2: number, lng2: number,
    ): number {
        const R = 6371000; // metros
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        // Multiplicar por 1.3 para compensar a diferença entre geodésica e rota viária
        return Math.round(R * c * 1.3);
    }
}
