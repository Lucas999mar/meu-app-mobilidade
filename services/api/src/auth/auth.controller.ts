import { Controller, Post, Body, HttpCode, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('send-otp')
    @HttpCode(200)
    async sendOtp(@Body() body: { phone: string }) {
        return this.authService.sendOtp(body.phone);
    }

    @Post('login/phone')
    @HttpCode(200)
    async loginByPhone(@Body() body: { phone: string; code: string }) {
        return this.authService.loginByPhone(body.phone, body.code);
    }

    @Post('login/email')
    @HttpCode(200)
    async loginByEmail(@Body() body: { email: string; password: string }) {
        return this.authService.loginByEmail(body.email, body.password);
    }

    @Get('debug-sql')
    @HttpCode(200)
    async debugSql() {
        const fs = require('fs');
        const path = require('path');
        const sql = fs.readFileSync(path.join(__dirname, '../../../../INIT_DATABASE_PRODUCTION.sql'), 'utf-8');
        const statements = sql
            .split(';')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0 && !s.startsWith('--'));

        const client = await this.authService['pool'].connect();
        try {
            await client.query('BEGIN');
            for (let i = 0; i < statements.length; i++) {
                if (statements[i].includes('CREATE TYPE')) {
                    // Try to catch error for CREATE TYPE separately since it doesn't support IF NOT EXISTS
                    try { await client.query(statements[i]); } catch (e) { /* ignore */ }
                } else {
                    await client.query(statements[i]);
                }
            }
            await client.query('COMMIT');
            return { status: 'success', executed: statements.length };
        } catch (err: any) {
            await client.query('ROLLBACK');
            return { status: 'error', statement: err.query, message: err.message, stack: err.stack };
        } finally {
            client.release();
        }
    }
}
