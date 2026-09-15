import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGateway } from './gateways/payment-gateway.interface';
import {
    AsaasGateway,
    PagarmeGateway,
    EfibankGateway,
    MercadoPagoGateway,
    StripeGateway
} from './gateways/all-gateways';

@Injectable()
export class PaymentsService {
    private readonly gateway: PaymentGateway;
    private readonly logger = new Logger(PaymentsService.name);

    constructor(private configService: ConfigService) {
        // Escolhe o provedor baseado na variável de ambiente (Etapa 5)
        // Permite trocar a inteligência financeira a qualquer momento sem mexer no código das corridas
        const provider = this.configService.get<string>('PAYMENT_PROVIDER', 'asaas').toLowerCase();

        switch (provider) {
            case 'pagarme': this.gateway = new PagarmeGateway(); break;
            case 'efibank': this.gateway = new EfibankGateway(); break;
            case 'mercadopago': this.gateway = new MercadoPagoGateway(); break;
            case 'stripe': this.gateway = new StripeGateway(); break;
            case 'asaas':
            default:
                this.gateway = new AsaasGateway();
        }
        this.logger.log(`💳 Motor de Pagamentos ativo: [${provider.toUpperCase()}]`);
    }

    // --- Rotinas Únicas que abstraem todos os gateways ---

    async processCardPayment(rideId: string, amountCents: number, cardToken: string) {
        this.logger.log(`Iniciando cobrança em cartão para a corrida ${rideId}`);
        return await this.gateway.chargeCreditCard(amountCents, cardToken, `Corrida Mobilidade: ${rideId}`);
    }

    async processPixPayment(rideId: string, amountCents: number) {
        this.logger.log(`Gerando código PIX para a corrida ${rideId}`);
        return await this.gateway.generatePix(amountCents, `Corrida Mobilidade: ${rideId}`);
    }
}
