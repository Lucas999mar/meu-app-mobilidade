import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

@Controller('customers')
export class CustomersController {
    constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) { }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    async getAllCustomers(@Query('page') page = 1, @Query('limit') limit = 20) {
        const offset = (+page - 1) * +limit;
        const result = await this.pool.query(
            `SELECT c.*, u.name, u.phone, u.email, u.is_active, u.created_at
       FROM customers c
       JOIN users u ON u.id = c.user_id
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
            [+limit, offset],
        );
        return result.rows;
    }
}
