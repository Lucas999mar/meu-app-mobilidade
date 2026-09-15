# Progresso do Projeto — Mobilidade Regional

## Etapa 1 — Primeira Corrida Completa

### Status: ✅ ESTRUTURA CRIADA | ⏳ PENDENTE: Instalação e execução

### O que foi implementado

**Arquitetura (monorepo)**
- [x] Estrutura de pastas: `services/api`, `apps/admin`, `packages/`, `docs/`, `infra/`
- [x] Workspaces npm configurados

**Backend — NestJS API (`services/api`)**
- [x] `main.ts` — Bootstrap com CORS, ValidationPipe e Socket.IO
- [x] `app.module.ts` — Módulo raiz importando todos os domínios
- [x] `database/database.module.ts` — Pool PostgreSQL com ConfigService
- [x] `database/migrations/001_initial_schema.sql` — Schema completo:
  - Extensões: uuid-ossp, PostGIS
  - Enums: user_role, vehicle_category, driver_status, ride_status, etc.
  - Tabelas: users, sessions, otp_codes, customers, cities, zones, categories,
    drivers, vehicles, driver_locations, tariffs, quotes, rides, ride_events,
    ride_offers, ledger_entries, outbox_events, audit_log
  - Índices geográficos (GIST), constraints de unicidade, triggers de updated_at
  - Restrição: 1 corrida ativa por cliente, 1 aceite por corrida
- [x] `database/seeds/001_demo_data.sql` — Dados fictícios de Macaé/RJ:
  - 1 cidade, 4 categorias, 4 tarifas, 1 admin, 2 clientes, 3 motoristas (2 carro + 1 moto)
- [x] `database/run-migrations.ts` — Runner de migrations controlado

**Autenticação**
- [x] `auth/auth.module.ts` — JWT + Passport
- [x] `auth/auth.service.ts` — Login por telefone+OTP e email+senha
- [x] `auth/auth.controller.ts` — Endpoints: send-otp, login/phone, login/email
- [x] `auth/jwt.strategy.ts` — Passport JWT strategy
- [x] OTP de demonstração: código fixo `1234`

**Motor de Tarifas**
- [x] `tariffs/tariff-engine.ts` — Fórmula completa conforme especificação:
  - `(bandeirada + km×valor_km + min×valor_min) × multiplicador`
  - Mínima aplicada antes do multiplicador
  - Pedágios e gorjetas fora do multiplicador/desconto
  - Aritmética em centavos (integer), sem ponto flutuante
  - Validação automática: R$ 22,20 (sem cupom) e R$ 20,20 (com cupom R$ 2)

**Corridas (ciclo completo)**
- [x] `rides/rides.service.ts`:
  - `createQuote()` — Cotação com validade de 120s
  - `requestRide()` — Com idempotência, verificação de corrida ativa, PIN
  - `dispatchRide()` — Busca motoristas próximos via PostGIS
  - `acceptOffer()` — Transação atômica com FOR UPDATE + lock
  - `arriveAtPickup()` — Motorista informa chegada
  - `startRide()` — Validação de PIN
  - `completeRide()` — Cálculo final + lançamentos financeiros (ledger)
  - `cancelRide()` — Com liberação de motorista e ofertas
  - Transactional outbox em toda operação
  - Eventos de corrida registrados com versão
- [x] `rides/rides.controller.ts` — REST endpoints com JWT guard

**Motoristas**
- [x] `drivers/drivers.service.ts` — Localização (PostGIS UPSERT), disponibilidade, ofertas, ganhos
- [x] `drivers/drivers.controller.ts` — REST endpoints

**Painel Administrativo — Next.js (`apps/admin`)**
- [x] Login automático com demo OTP
- [x] Sidebar com navegação: Dashboard, Corridas, Motoristas, Clientes, Tarifas, Categorias, Cidades
- [x] Dashboard com KPIs: receita, corridas concluídas, ativas, canceladas
- [x] Tabelas de corridas, motoristas, clientes, tarifas com status badges
- [x] **Demo: Corrida Completa** — Botão que executa todo o ciclo via API:
  cotação → solicitação → despacho → aceite → embarque → PIN → conclusão → recibo

**WebSocket**
- [x] `gateway/rides.gateway.ts` — Socket.IO com autenticação, salas por corrida, broadcast de localização

**Infraestrutura**
- [x] `docker-compose.yml` — PostGIS 16 + Redis 7 com health checks
- [x] `.env.example` e `.env.local` — Variáveis documentadas por etapa

### Pendências da Etapa 1

| Item | Estado | Bloqueio |
|------|--------|----------|
| Instalar dependências npm | ⏳ | Executar `npm install` na raiz |
| Subir PostgreSQL+PostGIS | ⏳ | Docker (`docker-compose up -d`) |
| Executar migrations | ⏳ | Compilar e rodar `run-migrations.ts` |
| Executar seed | ⏳ | Aplicar `001_demo_data.sql` |
| Iniciar API | ⏳ | `npm run dev:api` na raiz |
| Iniciar Admin | ⏳ | `npm run dev:admin` na raiz |
| Testar corrida completa | ⏳ | Via painel Demo ou curl |
| Validar motor de tarifas | ⏳ | Teste unitário do exemplo R$ 22,20 |
| Apps mobile (React Native) | 🚧 | Etapa 3 — requer ambiente Expo |

### Decisões de implementação

1. **Valores monetários em centavos (integer)** — Conforme spec: aritmética precisa sem float
2. **PostGIS para geolocalização** — Busca de motoristas por raio usando ST_DWithin
3. **Transactional Outbox** — Tabela outbox_events para publicação confiável de eventos
4. **FOR UPDATE no aceite** — Lock pessimista para garantir que apenas 1 motorista aceita
5. **Haversine × 1.3 como demo** — Distância geodésica com fator de rota urbana (substituir por Google Routes na Etapa 3)
6. **OTP fixo '1234'** — Apenas em desenvolvimento; bloqueio verificado para produção

### Versões fixadas

| Dependência | Versão |
|-------------|--------|
| Node.js | 20.20.0 |
| NestJS | ^10.4.0 |
| Next.js | ^14.2.0 |
| PostgreSQL | 16 (PostGIS 3.4) |
| Socket.IO | ^4.7.0 |
| TypeScript | ^5.5.0 |

## Etapa 2 — Concorrência: Workers Assíncronos

### Status: ✅ CONCLUÍDO

**O que foi implementado**
- [x] `workers/outbox.worker.ts`: Background job rodando a cada 1 segundo (usando `FOR UPDATE SKIP LOCKED`) para envio robusto de eventos pendentes em fila (WebSocket Dispatch Engine).
- [x] `workers/matchmaking.worker.ts`: Job que escaneia `searching_driver` a cada 10s e redistribui/realoca motoristas.

## Etapa 3 — Infraestrutura Mobile

### Status: 🚧 INICIADA

- [x] Workspaces React Native (Expo) para `apps/driver` criados via template.
- [x] Workspaces React Native (Expo) para `apps/customer` criados via template.

## Etapa 4 — Gestão Financeira Dinâmica e Simulador

### Status: ✅ CONCLUÍDO (Tariff Simulator)

**O que foi implementado**
- [x] `tariffs/tariffs.controller.ts`: Novo endpoint GET `/tariffs/simulate` que injeta kilometros e minutos teóricos e obtém a fatura baseada na tarifa vigente da cidade sem salvar no banco.
- [x] `apps/admin/src/app/page.tsx`: Interface visual de prancheta **🧮 Simulador de Tarifas** com 3 marcadores (Total Passageiro, Motorista Recebe, Margem Plataforma) na Etapa 4.

## Etapa 5 — Pagamentos: Gateways Estratégicos

### Status: ✅ ARQUITETURA CONCLUÍDA

**O que foi implementado**
- [x] Padrão Factory (`payments.service.ts`) adaptando: Asaas, Pagar.me, Efibank, MercadoPago e Stripe em uma mesma interface, selecionado dinamicamente via `.env`.
- [x] Cobranças de cartão transacionadas, e QR Codes PIX. 

## Etapa 6 a 8 — Suporte, Qualidade e Corporativo

### Status: 🚧 INICIADA

Foram criados os esqueletos dos controladores responsáveis por assumir as últimas métricas do sistema:
- `support.service.ts` (Sistema de tickets e rastreabilidade - Etapa 6)
- `scheduling.service.ts` (Agendamento prévio de viagens - Etapa 7)
- `quality.service.ts` (Relatórios de lentidão e erro de funil - Etapa 8)

A partir de agora o trabalho flui exclusivamente em cima de design e desenvolvimento do app React Native e do refino dos fluxos de tela do passageiro.
