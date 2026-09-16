import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        @Inject(DATABASE_POOL) private readonly pool: Pool,
        private readonly jwtService: JwtService,
    ) { }

    /**
     * Login por telefone + OTP (demonstração: aceita qualquer código '1234')
     */
    async loginByPhone(phone: string, otpCode: string): Promise<{ token: string; user: any }> {
        // Em ambiente de demonstração, aceitar OTP fixo
        if (otpCode !== '1234' && process.env.NODE_ENV !== 'production') {
            // Verificar OTP real no banco
            const otpResult = await this.pool.query(
                `SELECT * FROM otp_codes 
         WHERE phone = $1 AND code = $2 AND verified_at IS NULL 
         AND expires_at > NOW() AND attempts < max_attempts
         ORDER BY created_at DESC LIMIT 1`,
                [phone, otpCode],
            );

            if (otpResult.rows.length === 0) {
                throw new UnauthorizedException('Código OTP inválido ou expirado');
            }

            await this.pool.query(
                'UPDATE otp_codes SET verified_at = NOW() WHERE id = $1',
                [otpResult.rows[0].id],
            );
        }

        // Buscar ou criar usuário
        let userResult;
        try {
            userResult = await this.pool.query(
                'SELECT * FROM users WHERE phone = $1',
                [phone],
            );
        } catch (dbError: any) {
            throw new UnauthorizedException(`DB Error: ${dbError.message}`);
        }

        if (userResult.rows.length === 0) {
            throw new UnauthorizedException('Usuário não encontrado');
        }

        const user = userResult.rows[0];

        if (!user.is_active) {
            throw new UnauthorizedException('Conta desativada');
        }

        const token = this.jwtService.sign({
            sub: user.id,
            role: user.role,
            phone: user.phone,
        });

        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                avatar_url: user.avatar_url,
            },
        };
    }

    /**
     * Login por email + senha (para admin)
     */
    async loginByEmail(email: string, password: string): Promise<{ token: string; user: any }> {
        const result = await this.pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email],
        );

        if (result.rows.length === 0) {
            throw new UnauthorizedException('Credenciais inválidas');
        }

        const user = result.rows[0];

        if (user.password_hash) {
            const valid = await bcrypt.compare(password, user.password_hash);
            if (!valid) {
                throw new UnauthorizedException('Credenciais inválidas');
            }
        }

        if (!user.is_active) {
            throw new UnauthorizedException('Conta desativada');
        }

        const token = this.jwtService.sign({
            sub: user.id,
            role: user.role,
            email: user.email,
        });

        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }

    /**
     * Enviar OTP (demonstração: grava no banco, não envia SMS)
     */
    async sendOtp(phone: string): Promise<{ message: string }> {
        const code = process.env.NODE_ENV === 'production'
            ? Math.floor(100000 + Math.random() * 900000).toString()
            : '1234';

        await this.pool.query(
            `INSERT INTO otp_codes (phone, code, expires_at) 
       VALUES ($1, $2, NOW() + INTERVAL '5 minutes')`,
            [phone, code],
        );

        // TODO: integrar provedor SMS real em produção
        console.log(`📱 OTP para ${phone}: ${code} (demonstração)`);

        return { message: 'Código enviado' };
    }

    async validateToken(token: string) {
        try {
            return this.jwtService.verify(token);
        } catch {
            throw new UnauthorizedException('Token inválido');
        }
    }
}
