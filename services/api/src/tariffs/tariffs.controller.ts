import { Controller, Get, Post, Put, Body, Param, Query, Inject, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { calculateQuote, calculateEarnings } from './tariff-engine';

@Controller('tariffs')
export class TariffsController {
    constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) { }

    @Get('simulate')
    @UseGuards(AuthGuard('jwt'))
    async simulateTariff(
        @Query('cityId') cityId: string,
        @Query('categoryId') categoryId: string,
        @Query('distanceKm') distanceKm: number,
        @Query('durationMin') durationMin: number,
        @Query('dynamicMultiplier') dynamicMultiplier: number = 1.0,
        @Query('discountCents') discountCents: number = 0,
    ) {
        const tariffResult = await this.pool.query(
            `SELECT * FROM tariffs 
       WHERE city_id = $1 AND category_id = $2 AND is_active = TRUE
       ORDER BY priority DESC, version DESC LIMIT 1`,
            [cityId, categoryId],
        );

        if (tariffResult.rows.length === 0) {
            return { error: 'Tarifa não encontrada para esta cidade/categoria' };
        }

        const tariff = tariffResult.rows[0];

        const quote = calculateQuote(
            {
                baseFare: tariff.base_fare,
                perKm: tariff.per_km,
                perMinute: tariff.per_minute,
                minimumFare: tariff.minimum_fare,
                waitFreeMinutes: tariff.wait_free_minutes,
                waitPerMinute: tariff.wait_per_minute,
                cancellationFee: tariff.cancellation_fee,
                cancellationFreeSeconds: tariff.cancellation_free_seconds,
                platformCommissionRate: parseFloat(tariff.platform_commission_rate),
            },
            {
                distanceMeters: distanceKm * 1000,
                durationSeconds: durationMin * 60,
                dynamicMultiplier: parseFloat(dynamicMultiplier.toString()),
                discountCents: parseInt(discountCents.toString()),
            }
        );

        const { platformCommission, driverEarning } = calculateEarnings(
            quote.totalFare,
            quote.tollEstimate,
            0, // tipAmount
            quote.discount,
            parseFloat(tariff.platform_commission_rate)
        );

        return {
            simulation: {
                totalFare: `R$ ${(quote.totalFare / 100).toFixed(2)}`,
                driverEarning: `R$ ${(driverEarning / 100).toFixed(2)}`,
                platformCommission: `R$ ${(platformCommission / 100).toFixed(2)}`,
            },
            raw: quote,
            tariffVersion: tariff.version
        };
    }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    async getTariffs(@Query('cityId') cityId?: string, @Query('categoryId') categoryId?: string) {
        let query = 'SELECT t.*, c.name as city_name, cat.display_name as category_name FROM tariffs t JOIN cities c ON c.id = t.city_id JOIN categories cat ON cat.id = t.category_id WHERE t.is_active = TRUE';
        const params: any[] = [];

        if (cityId) {
            params.push(cityId);
            query += ` AND t.city_id = $${params.length}`;
        }
        if (categoryId) {
            params.push(categoryId);
            query += ` AND t.category_id = $${params.length}`;
        }

        query += ' ORDER BY t.priority DESC, t.version DESC';
        const result = await this.pool.query(query, params);
        return result.rows;
    }

    @Put(':id')
    @UseGuards(AuthGuard('jwt'))
    async updateTariff(@Param('id') id: string, @Body() body: any) {
        const current = await this.pool.query('SELECT * FROM tariffs WHERE id = $1', [id]);
        if (current.rows.length === 0) return { error: 'Tarifa não encontrada' };
        const old = current.rows[0];

        await this.pool.query('UPDATE tariffs SET is_active = FALSE, valid_until = NOW() WHERE id = $1', [id]);

        const newVersion = old.version + 1;
        const result = await this.pool.query(
            `INSERT INTO tariffs (
        city_id, category_id, zone_id, base_fare, per_km, per_minute, minimum_fare,
        wait_free_minutes, wait_per_minute, cancellation_fee, cancellation_free_seconds,
        platform_commission_rate, version, is_active, priority
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,TRUE,$14) RETURNING *`,
            [
                old.city_id, old.category_id, old.zone_id, body.baseFare ?? old.base_fare, body.perKm ?? old.per_km,
                body.perMinute ?? old.per_minute, body.minimumFare ?? old.minimum_fare, body.waitFreeMinutes ?? old.wait_free_minutes,
                body.waitPerMinute ?? old.wait_per_minute, body.cancellationFee ?? old.cancellation_fee, body.cancellationFreeSeconds ?? old.cancellation_free_seconds,
                body.platformCommissionRate ?? old.platform_commission_rate, newVersion, old.priority,
            ]
        );

        return result.rows[0];
    }

    @Get('categories')
    async getCategories() {
        const result = await this.pool.query('SELECT * FROM categories WHERE is_active = TRUE ORDER BY sort_order');
        return result.rows;
    }

    @Get('cities')
    async getCities() {
        const result = await this.pool.query('SELECT id, name, state, timezone, is_active FROM cities ORDER BY name');
        return result.rows;
    }
}
