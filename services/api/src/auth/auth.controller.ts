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
        try {
            await this.authService['pool'].query(sql); // bypassing private with bracket notation
            return { status: 'success' };
        } catch (err: any) {
            return { status: 'error', message: err.message, stack: err.stack };
        }
    }
}
