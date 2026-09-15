import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

@Controller('admin')
export class AdminController {
    constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) { }

    @Get('dashboard')
    @UseGuards(AuthGuard('jwt'))
    async getDashboard() {
        const [rides, activeDrivers, revenue, todayRides] = await Promise.all([
            this.pool.query(`
        SELECT status, COUNT(*) as count
        FROM rides
        GROUP BY status
      `),
            this.pool.query(`
        SELECT availability, COUNT(*) as count
        FROM drivers
        WHERE status = 'approved'
        GROUP BY availability
      `),
            this.pool.query(`
        SELECT 
          COALESCE(SUM(total_charged), 0) as total_revenue,
          COUNT(*) as completed_rides
        FROM rides
        WHERE status = 'completed'
      `),
            this.pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
          COUNT(*) FILTER (WHERE status IN ('requested','searching_driver','driver_assigned','en_route_pickup','arrived_pickup','in_ride')) as active,
          COALESCE(SUM(total_charged) FILTER (WHERE status = 'completed'), 0) as today_revenue
        FROM rides
        WHERE created_at >= CURRENT_DATE
      `),
        ]);

        const rev = revenue.rows[0];
        const today = todayRides.rows[0];

        return {
            overview: {
                totalRevenue: parseInt(rev.total_revenue),
                formattedRevenue: `R$ ${(parseInt(rev.total_revenue) / 100).toFixed(2)}`,
                totalCompleted: parseInt(rev.completed_rides),
            },
            today: {
                completed: parseInt(today.completed),
                cancelled: parseInt(today.cancelled),
                active: parseInt(today.active),
                revenue: parseInt(today.today_revenue),
                formattedRevenue: `R$ ${(parseInt(today.today_revenue) / 100).toFixed(2)}`,
            },
            ridesByStatus: rides.rows.reduce((acc: any, r: any) => {
                acc[r.status] = parseInt(r.count);
                return acc;
            }, {}),
            driversByAvailability: activeDrivers.rows.reduce((acc: any, d: any) => {
                acc[d.availability] = parseInt(d.count);
                return acc;
            }, {}),
        };
    }

    @Get('rides')
    @UseGuards(AuthGuard('jwt'))
    async getAllRides() {
        const result = await this.pool.query(
            `SELECT r.*, 
              cu.name as customer_name, cu.phone as customer_phone,
              du.name as driver_name,
              v.brand, v.model, v.plate,
              cat.display_name as category_name
       FROM rides r
       LEFT JOIN customers c ON c.id = r.customer_id
       LEFT JOIN users cu ON cu.id = c.user_id
       LEFT JOIN drivers d ON d.id = r.driver_id
       LEFT JOIN users du ON du.id = d.user_id
       LEFT JOIN vehicles v ON v.id = r.vehicle_id
       LEFT JOIN categories cat ON cat.id = r.category_id
       ORDER BY r.created_at DESC
       LIMIT 100`,
        );
        return result.rows;
    }

    @Get('rides/:id/events')
    async getRideEvents(@Param('id') id: string) {
        const result = await this.pool.query(
            `SELECT re.*, u.name as actor_name
       FROM ride_events re
       LEFT JOIN users u ON u.id = re.actor_id
       WHERE re.ride_id = $1
       ORDER BY re.occurred_at ASC`,
            [id],
        );
        return result.rows;
    }
}
