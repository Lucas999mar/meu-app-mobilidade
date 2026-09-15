import io, { Socket } from 'socket.io-client';

const API_URL = 'https://mobilidade-api.onrender.com';

class SocketService {
    private socket: Socket | null = null;
    private token: string | null = null;

    connect(token: string) {
        this.token = token;
        this.socket = io(API_URL, {
            auth: { token },
            transports: ['websocket'],
        });

        this.socket.on('connect', () => {
            console.log('🔗 WebSocket App conectado!');
        });

        this.socket.on('disconnect', () => {
            console.log('⚠️ WebSocket App desconectado!');
        });
    }

    // Monitora localização de motoristas (para o Cliente)
    onDriverLocationUpdate(callback: (data: any) => void) {
        this.socket?.on('driver:location_update', callback);
    }

    // Envia coordendas GPS do motorista para a nuvem
    sendLocationUpdate(locationObj: { lat: number; lng: number }) {
        this.socket?.emit('updateLocation', locationObj);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
