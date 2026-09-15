import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

@Injectable()
export class DriversService {
    private readonly logger = new Logger(DriversService.name);

    constructor(
        @Inject(DATABASE_POOL) private readonly pool: Pool,
    ) { }

    async updateLocation(driverId: string, lat: number, lng: number, heading?: number, speed?: number, accuracy?: number) {
        await this.pool.query(
            `INSERT INTO driver_locations (driver_id, location, heading, speed, accuracy, updated_at)
       VALUES ($1, ST_SetSRID(ST_MakePoint($3, $2), 4326), $4, $5, $6, NOW())
       ON CONFLICT (driver_id)
       DO UPDATE SET location = ST_SetSRID(ST_MakePoint($3, $2), 4326),
                     heading = $4, speed = $5, accuracy = $6, updated_at = NOW()`,
            [driverId, lat, lng, heading || null, speed || null, accuracy || null],
        );
    }

    async setAvailability(driverId: string, availability: string) {
        const result = await this.pool.query(
            `UPDATE drivers SET availability = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
            [availability, driverId],
        );

        if (result.rows.length === 0) {
            throw new NotFoundException('Motorista não encontrado');
        }

        this.logger.log(`🚗 Motorista ${driverId} agora está ${availability}`);
        return result.rows[0];
    }

    async getDriverProfile(userId: string) {
        const result = await this.pool.query(
            `SELECT d.*, u.name, u.phone, u.avatar_url,
              v.brand, v.model, v.year, v.color, v.plate,
              cat.display_name as category_name,
              ci.name as city_name
       FROM drivers d
       JOIN users u ON u.id = d.user_id
       LEFT JOIN vehicles v ON v.id = d.active_vehicle_id
       LEFT JOIN categories cat ON cat.id = v.category_id
       LEFT JOIN cities ci ON ci.id = d.city_id
       WHERE d.user_id = $1`,
            [userId],
        );

        return result.rows[0] || null;
    }

    async getPendingOffers(driverId: string) {
        const result = await this.pool.query(
            `SELECT ro.*, r.origin_address, r.destination_address,
              r.distance_meters, r.duration_seconds, r.contracted_fare,
              cat.display_name as category_name
       FROM ride_offers ro
       JOIN rides r ON r.id = ro.ride_id
       JOIN categories cat ON cat.id = r.category_id
       WHERE ro.driver_id = $1 AND ro.status = 'pending'
         AND ro.expires_at > NOW()
       ORDER BY ro.created_at DESC`,
            [driverId],
        );

        return result.rows;
    }

    async getEarnings(driverId: string, period: string = 'today') {
        let dateFilter = "created_at >= CURRENT_DATE";

        if (period === 'week') {
            dateFilter = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
        } else if (period === 'month') {
            dateFilter = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
        }

        const driverResult = await this.pool.query(
            'SELECT user_id FROM drivers WHERE id = $1', [driverId]
        );

        if (driverResult.rows.length === 0) {
            throw new NotFoundException('Motorista não encontrado');
        }

        const result = await this.pool.query(
            `SELECT 
        COALESCE(SUM(credit), 0) as total_earnings,
        COUNT(*) as total_rides
       FROM ledger_entries
       WHERE user_id = $1 AND entry_type = 'driver_earning' AND ${dateFilter}`,
            [driverResult.rows[0].user_id],
        );

        return {
            totalEarnings: parseInt(result.rows[0].total_earnings),
            formattedEarnings: `R$ ${(parseInt(result.rows[0].total_earnings) / 100).toFixed(2)}`,
            totalRides: parseInt(result.rows[0].total_rides),
            period,
        };
    }

    async getAllDrivers(page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const result = await this.pool.query(
            `SELECT d.*, u.name, u.phone, 
              v.brand, v.model, v.plate,
              cat.display_name as category_name,
              ci.name as city_name
       FROM drivers d
       JOIN users u ON u.id = d.user_id
       LEFT JOIN vehicles v ON v.id = d.active_vehicle_id
       LEFT JOIN categories cat ON cat.id = v.category_id
       LEFT JOIN cities ci ON ci.id = d.city_id
       ORDER BY d.created_at DESC
       LIMIT $1 OFFSET $2`,
            [limit, offset],
        );
        return result.rows;
    }
}
