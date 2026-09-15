import {
    WebSocketGateway, WebSocketServer,
    SubscribeMessage, OnGatewayInit,
    OnGatewayConnection, OnGatewayDisconnect,
    MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/rides',
})
export class RidesGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private readonly logger = new Logger(RidesGateway.name);
    private connectedUsers = new Map<string, Socket>();

    constructor(private readonly authService: AuthService) { }

    afterInit() {
        this.logger.log('🔌 WebSocket Gateway inicializado');
    }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth?.token || client.handshake.query?.token;
            if (token) {
                const user = await this.authService.validateToken(token as string);
                (client as any).user = user;
                this.connectedUsers.set(user.sub, client);
                this.logger.log(`✅ Conectado: ${user.sub} (${user.role})`);
            }
        } catch (error) {
            this.logger.warn('⚠️ Conexão não autenticada');
        }
    }

    handleDisconnect(client: Socket) {
        const user = (client as any).user;
        if (user) {
            this.connectedUsers.delete(user.sub);
            this.logger.log(`🔌 Desconectado: ${user.sub}`);
        }
    }

    @SubscribeMessage('join:ride')
    handleJoinRide(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { rideId: string },
    ) {
        client.join(`ride:${data.rideId}`);
        this.logger.log(`👤 Entrou na sala ride:${data.rideId}`);
        return { event: 'joined', rideId: data.rideId };
    }

    @SubscribeMessage('leave:ride')
    handleLeaveRide(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { rideId: string },
    ) {
        client.leave(`ride:${data.rideId}`);
        return { event: 'left', rideId: data.rideId };
    }

    @SubscribeMessage('driver:location')
    handleDriverLocation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { rideId: string; lat: number; lng: number; heading: number },
    ) {
        // Broadcast para a sala da corrida
        this.server.to(`ride:${data.rideId}`).emit('driver:location:update', {
            rideId: data.rideId,
            lat: data.lat,
            lng: data.lng,
            heading: data.heading,
            timestamp: new Date().toISOString(),
        });
    }

    // Métodos para o serviço emitir eventos
    emitToRide(rideId: string, event: string, data: any) {
        this.server.to(`ride:${rideId}`).emit(event, {
            ...data,
            eventId: `${event}-${Date.now()}`,
            occurredAt: new Date().toISOString(),
        });
    }

    emitToUser(userId: string, event: string, data: any) {
        const socket = this.connectedUsers.get(userId);
        if (socket) {
            socket.emit(event, {
                ...data,
                eventId: `${event}-${Date.now()}`,
                occurredAt: new Date().toISOString(),
            });
        }
    }

    emitToAll(event: string, data: any) {
        this.server.emit(event, data);
    }
}
