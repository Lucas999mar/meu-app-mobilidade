import { PaymentGateway, PaymentResult, PixResult } from './payment-gateway.interface';

// 1. ASAAS
export class AsaasGateway implements PaymentGateway {
    async chargeCreditCard(amount: number, token: string, desc: string): Promise<PaymentResult> {
        console.log(`[ASAAS] Cobrando R$ ${amount / 100} ...`);
        return { success: true, transactionId: 'asaas_cc_123', status: 'approved' };
    }
    async generatePix(amount: number, desc: string): Promise<PixResult> {
        return { success: true, transactionId: 'asaas_pix_123', qrCodeImage: 'img', qrCodePayload: 'payload', expiresInSeconds: 3600 };
    }
    async createSplitRule(rec: string, pct: number): Promise<boolean> { return true; }
}

// 2. PAGAR.ME
export class PagarmeGateway implements PaymentGateway {
    async chargeCreditCard(amount: number, token: string, desc: string): Promise<PaymentResult> {
        console.log(`[PAGAR.ME] Cobrando R$ ${amount / 100} ...`);
        return { success: true, transactionId: 'pagarme_cc_123', status: 'approved' };
    }
    async generatePix(amount: number, desc: string): Promise<PixResult> {
        return { success: true, transactionId: 'pagarme_pix_123', qrCodeImage: 'img', qrCodePayload: 'payload', expiresInSeconds: 3600 };
    }
    async createSplitRule(rec: string, pct: number): Promise<boolean> { return true; }
}

// 3. EFIBANK (Gerencianet)
export class EfibankGateway implements PaymentGateway {
    async chargeCreditCard(amount: number, token: string, desc: string): Promise<PaymentResult> {
        return { success: true, transactionId: 'efi_cc_123', status: 'approved' };
    }
    async generatePix(amount: number, desc: string): Promise<PixResult> {
        return { success: true, transactionId: 'efi_pix_123', qrCodeImage: 'img', qrCodePayload: 'payload', expiresInSeconds: 3600 };
    }
    async createSplitRule(rec: string, pct: number): Promise<boolean> { return true; }
}

// 4. MERCADO PAGO
export class MercadoPagoGateway implements PaymentGateway {
    async chargeCreditCard(amount: number, token: string, desc: string): Promise<PaymentResult> {
        return { success: true, transactionId: 'mp_cc_123', status: 'approved' };
    }
    async generatePix(amount: number, desc: string): Promise<PixResult> {
        return { success: true, transactionId: 'mp_pix_123', qrCodeImage: 'img', qrCodePayload: 'payload', expiresInSeconds: 3600 };
    }
    async createSplitRule(rec: string, pct: number): Promise<boolean> { return true; }
}

// 5. STRIPE
export class StripeGateway implements PaymentGateway {
    async chargeCreditCard(amount: number, token: string, desc: string): Promise<PaymentResult> {
        return { success: true, transactionId: 'stripe_cc_123', status: 'approved' };
    }
    async generatePix(amount: number, desc: string): Promise<PixResult> {
        return { success: true, transactionId: 'stripe_pix_123', qrCodeImage: 'img', qrCodePayload: 'payload', expiresInSeconds: 3600 };
    }
    async createSplitRule(rec: string, pct: number): Promise<boolean> { return true; }
}
