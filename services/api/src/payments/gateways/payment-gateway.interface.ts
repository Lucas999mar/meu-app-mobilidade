export interface PaymentGateway {
    /** Inicia uma cobrança no cartão de crédito */
    chargeCreditCard(amountCents: number, cardToken: string, description: string): Promise<PaymentResult>;

    /** Gera um QR Code e Copia e Cola para PIX */
    generatePix(amountCents: number, description: string): Promise<PixResult>;

    /** Configura regras de transferência (Split) entre Motorista e Plataforma */
    createSplitRule(receiverId: string, percentage: number): Promise<boolean>;
}

export interface PaymentResult {
    success: boolean;
    transactionId: string;
    status: 'approved' | 'declined' | 'processing';
    message?: string;
}

export interface PixResult {
    success: boolean;
    transactionId: string;
    qrCodeImage: string;
    qrCodePayload: string;
    expiresInSeconds: number;
}
