import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
        credentials: true,
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    app.setGlobalPrefix('api');
    app.useWebSocketAdapter(new IoAdapter(app));

    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚗 Mobilidade Regional API rodando na porta ${port}`);
    console.log(`📡 WebSocket disponível em ws://localhost:${port}`);
}

bootstrap();
