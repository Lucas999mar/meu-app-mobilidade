/**
 * Motor de Tarifas — Mobilidade Regional
 * 
 * Valores em centavos (integer). Aritmética precisa, sem ponto flutuante.
 * 
 * Fórmula:
 *   componente_variavel = bandeirada + (km_rota × valor_km) + (min_rota × valor_min)
 *   tarifa_deslocamento = max(corrida_minima, componente_variavel) × multiplicador
 *   tarifa_servico = tarifa_deslocamento + espera_cobrável + adicionais
 *   desconto_aplicado = min(desconto_elegivel, tarifa_servico)
 *   total_passageiro = tarifa_servico - desconto + pedágios + gorjeta
 */

export interface TariffConfig {
    baseFare: number;          // centavos — bandeirada
    perKm: number;             // centavos por km
    perMinute: number;         // centavos por minuto
    minimumFare: number;       // centavos — corrida mínima
    waitFreeMinutes: number;
    waitPerMinute: number;     // centavos por min de espera
    cancellationFee: number;   // centavos
    cancellationFreeSeconds: number;
    platformCommissionRate: number; // 0.2000 = 20%
}

export interface QuoteInput {
    distanceMeters: number;
    durationSeconds: number;
    dynamicMultiplier?: number;
    discountCents?: number;
    tollEstimateCents?: number;
    waitMinutes?: number;
    additionalCents?: number;
}

export interface QuoteResult {
    baseFare: number;
    distanceFare: number;
    durationFare: number;
    variableComponent: number;
    minimumApplied: boolean;
    dynamicMultiplier: number;
    rideFare: number;
    waitFare: number;
    additionalFare: number;
    tollEstimate: number;
    serviceFare: number;
    discount: number;
    totalFare: number;
    // Para transparência
    breakdown: {
        distanceKm: number;
        durationMinutes: number;
        pricePerKm: number;
        pricePerMinute: number;
    };
}

/**
 * Calcula a cotação de uma corrida.
 * Todos os valores monetários são em centavos (integer).
 */
export function calculateQuote(
    tariff: TariffConfig,
    input: QuoteInput,
): QuoteResult {
    const distanceKm = input.distanceMeters / 1000;
    const durationMinutes = input.durationSeconds / 60;
    const multiplier = input.dynamicMultiplier || 1.0;

    // Componente variável
    const distanceFare = Math.round(distanceKm * tariff.perKm);
    const durationFare = Math.round(durationMinutes * tariff.perMinute);
    const variableComponent = tariff.baseFare + distanceFare + durationFare;

    // Aplica mínima antes do multiplicador (conforme spec)
    const afterMinimum = Math.max(tariff.minimumFare, variableComponent);
    const minimumApplied = variableComponent < tariff.minimumFare;

    // Tarifa de deslocamento com multiplicador dinâmico
    const rideFare = Math.round(afterMinimum * multiplier);

    // Espera cobrável (além da franquia)
    let waitFare = 0;
    if (input.waitMinutes && input.waitMinutes > tariff.waitFreeMinutes) {
        const chargeableMinutes = input.waitMinutes - tariff.waitFreeMinutes;
        waitFare = Math.round(chargeableMinutes * tariff.waitPerMinute);
    }

    // Adicionais
    const additionalFare = input.additionalCents || 0;

    // Tarifa de serviço
    const serviceFare = rideFare + waitFare + additionalFare;

    // Desconto (não pode superar tarifa de serviço)
    const discount = Math.min(input.discountCents || 0, serviceFare);

    // Pedágios não sofrem multiplicador nem desconto
    const tollEstimate = input.tollEstimateCents || 0;

    // Total do passageiro (gorjeta adicionada depois, na conclusão)
    const totalFare = serviceFare - discount + tollEstimate;

    return {
        baseFare: tariff.baseFare,
        distanceFare,
        durationFare,
        variableComponent,
        minimumApplied,
        dynamicMultiplier: multiplier,
        rideFare,
        waitFare,
        additionalFare,
        tollEstimate,
        serviceFare,
        discount,
        totalFare,
        breakdown: {
            distanceKm: Math.round(distanceKm * 100) / 100,
            durationMinutes: Math.round(durationMinutes * 100) / 100,
            pricePerKm: tariff.perKm,
            pricePerMinute: tariff.perMinute,
        },
    };
}

/**
 * Calcula comissões e ganhos do motorista.
 */
export function calculateEarnings(
    totalFare: number,
    tollFare: number,
    tipAmount: number,
    discountAmount: number,
    commissionRate: number,
): {
    grossFare: number;
    commissionBase: number;
    platformCommission: number;
    driverEarning: number;
    tollPassthrough: number;
    tip: number;
} {
    // Base comissionável = tarifa de serviço antes do cupom
    // Pedágio e gorjeta ficam fora da comissão
    const commissionBase = totalFare - tollFare + discountAmount;
    const platformCommission = Math.round(commissionBase * commissionRate);
    const driverEarning = commissionBase - platformCommission;

    return {
        grossFare: totalFare,
        commissionBase,
        platformCommission,
        driverEarning,
        tollPassthrough: tollFare,
        tip: tipAmount,
    };
}

/**
 * Valida o exemplo fictício da especificação:
 * bandeirada R$ 4, R$ 2/km, R$ 0,30/min, mínima R$ 10, 5km, 15min, mult 1.20
 * Resultado esperado: R$ 22,20 (sem cupom) e R$ 20,20 (com cupom R$ 2)
 */
export function validateSpecExample(): boolean {
    const tariff: TariffConfig = {
        baseFare: 400,
        perKm: 200,
        perMinute: 30,
        minimumFare: 1000,
        waitFreeMinutes: 5,
        waitPerMinute: 50,
        cancellationFee: 500,
        cancellationFreeSeconds: 120,
        platformCommissionRate: 0.20,
    };

    // Sem cupom
    const result1 = calculateQuote(tariff, {
        distanceMeters: 5000,
        durationSeconds: 900,
        dynamicMultiplier: 1.20,
    });

    // Com cupom R$ 2
    const result2 = calculateQuote(tariff, {
        distanceMeters: 5000,
        durationSeconds: 900,
        dynamicMultiplier: 1.20,
        discountCents: 200,
    });

    const test1 = result1.totalFare === 2220;  // R$ 22,20
    const test2 = result2.totalFare === 2020;  // R$ 20,20

    if (!test1 || !test2) {
        console.error('❌ Falha na validação do motor de tarifas!');
        console.error(`  Sem cupom: esperado 2220, obtido ${result1.totalFare}`);
        console.error(`  Com cupom: esperado 2020, obtido ${result2.totalFare}`);
        return false;
    }

    console.log('✅ Motor de tarifas validado com exemplo da especificação');
    console.log(`  (4 + 5×2 + 15×0,30) × 1,20 = R$ 22,20 ✓`);
    console.log(`  Com cupom R$ 2,00 = R$ 20,20 ✓`);
    return true;
}
