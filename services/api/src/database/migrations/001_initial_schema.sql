-- Migration 001: Schema inicial — Mobilidade Regional
-- Modelo de dados para corridas, motoristas, clientes, tarifas e finanças
-- Valores monetários em centavos (integer) para precisão

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'customer', 'driver', 'owner', 'manager', 'operator',
  'financial', 'support', 'auditor'
);

CREATE TYPE vehicle_category AS ENUM (
  'economy_car', 'comfort_car', 'executive_car', 'moto'
);

CREATE TYPE driver_status AS ENUM (
  'pending_approval', 'approved', 'rejected', 'suspended', 'inactive'
);

CREATE TYPE driver_availability AS ENUM (
  'offline', 'available', 'reserved', 'en_route', 'in_ride', 'paused'
);

CREATE TYPE ride_status AS ENUM (
  'quoted', 'requested', 'searching_driver', 'driver_assigned',
  'en_route_pickup', 'arrived_pickup', 'in_ride', 'completed',
  'cancelled', 'no_driver'
);

CREATE TYPE offer_status AS ENUM (
  'pending', 'accepted', 'rejected', 'expired', 'withdrawn'
);

CREATE TYPE payment_method AS ENUM ('credit_card', 'debit_card', 'pix', 'cash');

CREATE TYPE payment_status AS ENUM (
  'created', 'pending', 'authorized', 'paid', 'failed',
  'cancelled', 'refund_pending', 'refunded', 'disputed'
);

CREATE TYPE ledger_entry_type AS ENUM (
  'ride_fare', 'platform_commission', 'driver_earning',
  'toll', 'tip', 'discount', 'refund', 'payout',
  'cancellation_fee', 'wait_fee'
);

-- ============================================================
-- TABELAS CORE
-- ============================================================

-- Usuários (autenticação unificada)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  phone_verified BOOLEAN DEFAULT FALSE,
  email VARCHAR(255),
  password_hash VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessões
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL,
  device_info JSONB,
  ip_address VARCHAR(45),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);

-- OTP
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_otp_phone ON otp_codes(phone);

-- ============================================================
-- CLIENTES
-- ============================================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  home_address JSONB,
  work_address JSONB,
  favorite_addresses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CIDADES E ZONAS
-- ============================================================

CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  state VARCHAR(2) NOT NULL,
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  is_active BOOLEAN DEFAULT TRUE,
  boundary GEOMETRY(Polygon, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'standard', -- standard, airport, event, etc.
  polygon GEOMETRY(Polygon, 4326) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zones_polygon ON zones USING GIST(polygon);
CREATE INDEX idx_zones_city ON zones(city_id);

-- ============================================================
-- CATEGORIAS E VEÍCULOS
-- ============================================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug vehicle_category NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  min_year INTEGER,
  max_passengers INTEGER DEFAULT 4,
  requires_motorcycle_license BOOLEAN DEFAULT FALSE,
  icon_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE city_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(city_id, category_id)
);

-- ============================================================
-- MOTORISTAS
-- ============================================================

CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  cpf VARCHAR(14),
  cnh_number VARCHAR(20),
  cnh_category VARCHAR(5),        -- A, B, AB, etc.
  cnh_expiry DATE,
  status driver_status DEFAULT 'pending_approval',
  availability driver_availability DEFAULT 'offline',
  city_id UUID REFERENCES cities(id),
  rating_avg DECIMAL(3,2) DEFAULT 5.00,
  rating_count INTEGER DEFAULT 0,
  commission_rate DECIMAL(5,4) DEFAULT 0.2000, -- 20%
  approved_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR(50) NOT NULL,
  plate VARCHAR(10) NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_driver ON vehicles(driver_id);

-- Veículo ativo do motorista
ALTER TABLE drivers ADD COLUMN active_vehicle_id UUID REFERENCES vehicles(id);

-- Localização do motorista (atualização frequente)
CREATE TABLE driver_locations (
  driver_id UUID PRIMARY KEY REFERENCES drivers(id),
  location GEOMETRY(Point, 4326) NOT NULL,
  heading REAL,
  speed REAL,
  accuracy REAL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_driver_locations_geo ON driver_locations USING GIST(location);

-- ============================================================
-- TARIFAS
-- ============================================================

CREATE TABLE tariffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  zone_id UUID REFERENCES zones(id),                -- NULL = regra padrão da cidade
  
  -- Valores em centavos
  base_fare INTEGER NOT NULL DEFAULT 400,              -- bandeirada R$ 4,00
  per_km INTEGER NOT NULL DEFAULT 200,                 -- R$ 2,00/km
  per_minute INTEGER NOT NULL DEFAULT 30,              -- R$ 0,30/min
  minimum_fare INTEGER NOT NULL DEFAULT 1000,           -- mínima R$ 10,00

  -- Espera
  wait_free_minutes INTEGER DEFAULT 5,
  wait_per_minute INTEGER DEFAULT 50,                  -- R$ 0,50/min espera

  -- Cancelamento
  cancellation_fee INTEGER DEFAULT 500,                 -- R$ 5,00
  cancellation_free_seconds INTEGER DEFAULT 120,        -- 2 min sem cobrança

  -- Dinâmica
  dynamic_multiplier_min DECIMAL(3,2) DEFAULT 1.00,
  dynamic_multiplier_max DECIMAL(3,2) DEFAULT 3.00,

  -- Comissão da plataforma
  platform_commission_rate DECIMAL(5,4) DEFAULT 0.2000,

  -- Vigência
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,

  -- Dia / horário (para variações)
  day_of_week INTEGER[],           -- 0=Dom...6=Sáb, NULL=todos
  hour_start INTEGER,              -- 0-23, NULL=todo horário
  hour_end INTEGER,

  priority INTEGER DEFAULT 0,      -- maior = mais específico
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(city_id, category_id, zone_id, version)
);

CREATE INDEX idx_tariffs_city_cat ON tariffs(city_id, category_id);

-- ============================================================
-- COTAÇÕES
-- ============================================================

CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  city_id UUID NOT NULL REFERENCES cities(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  tariff_id UUID NOT NULL REFERENCES tariffs(id),

  -- Endereços
  origin_address TEXT NOT NULL,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  destination_address TEXT NOT NULL,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lng DOUBLE PRECISION NOT NULL,

  -- Rota
  distance_meters INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  route_polyline TEXT,

  -- Cálculo em centavos
  base_fare INTEGER NOT NULL,
  distance_fare INTEGER NOT NULL,
  duration_fare INTEGER NOT NULL,
  variable_component INTEGER NOT NULL,     -- base + dist + dur
  minimum_applied BOOLEAN DEFAULT FALSE,
  dynamic_multiplier DECIMAL(3,2) DEFAULT 1.00,
  ride_fare INTEGER NOT NULL,              -- após mínimo e multiplicador
  wait_fare INTEGER DEFAULT 0,
  additional_fare INTEGER DEFAULT 0,
  toll_estimate INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  total_fare INTEGER NOT NULL,             -- passageiro paga

  -- Vigência
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quotes_customer ON quotes(customer_id);

-- ============================================================
-- CORRIDAS
-- ============================================================

CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  driver_id UUID REFERENCES drivers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  city_id UUID NOT NULL REFERENCES cities(id),
  category_id UUID NOT NULL REFERENCES categories(id),

  -- Estado
  status ride_status NOT NULL DEFAULT 'requested',
  version INTEGER NOT NULL DEFAULT 1,

  -- Idempotência
  idempotency_key VARCHAR(255) UNIQUE,

  -- Endereços (snapshot from quote)
  origin_address TEXT NOT NULL,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  destination_address TEXT NOT NULL,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lng DOUBLE PRECISION NOT NULL,

  -- Rota
  distance_meters INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,

  -- Valores contratados em centavos
  contracted_fare INTEGER NOT NULL,
  dynamic_multiplier DECIMAL(3,2) DEFAULT 1.00,
  tariff_version INTEGER NOT NULL,

  -- PIN
  pin_code VARCHAR(4),

  -- Tempos
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  driver_assigned_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,       -- viagem iniciada (PIN validado)
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- Cancelamento
  cancelled_by UUID REFERENCES users(id),
  cancellation_reason TEXT,
  cancellation_fee INTEGER DEFAULT 0,

  -- Valores finais
  final_distance_meters INTEGER,
  final_duration_seconds INTEGER,
  final_fare INTEGER,
  wait_fare INTEGER DEFAULT 0,
  toll_fare INTEGER DEFAULT 0,
  tip INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  total_charged INTEGER,           -- total cobrado do passageiro

  -- Pagamento
  payment_method payment_method,
  payment_status payment_status DEFAULT 'created',

  -- Avaliações
  customer_rating SMALLINT,        -- 1-5
  driver_rating SMALLINT,          -- 1-5
  customer_comment TEXT,
  driver_comment TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rides_customer ON rides(customer_id);
CREATE INDEX idx_rides_driver ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_idempotency ON rides(idempotency_key);

-- Histórico de transições de estado
CREATE TABLE ride_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id),
  event_type VARCHAR(50) NOT NULL,
  ride_version INTEGER NOT NULL,
  actor_id UUID REFERENCES users(id),
  data JSONB,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ride_events_ride ON ride_events(ride_id);

-- Restrição: apenas 1 corrida ativa por cliente
CREATE UNIQUE INDEX idx_rides_active_customer 
  ON rides(customer_id) 
  WHERE status IN ('requested', 'searching_driver', 'driver_assigned', 
                   'en_route_pickup', 'arrived_pickup', 'in_ride');

-- ============================================================
-- OFERTAS A MOTORISTAS
-- ============================================================

CREATE TABLE ride_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  round INTEGER DEFAULT 1,
  status offer_status DEFAULT 'pending',
  distance_to_pickup_meters INTEGER,
  eta_seconds INTEGER,
  earnings_estimate INTEGER,      -- centavos
  expires_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offers_ride ON ride_offers(ride_id);
CREATE INDEX idx_offers_driver ON ride_offers(driver_id);

-- Restrição: 1 motorista por corrida ativa
CREATE UNIQUE INDEX idx_offers_accepted_ride 
  ON ride_offers(ride_id) 
  WHERE status = 'accepted';

-- ============================================================
-- RAZÃO FINANCEIRO (Ledger)
-- ============================================================

CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID REFERENCES rides(id),
  entry_type ledger_entry_type NOT NULL,
  description TEXT,
  debit INTEGER DEFAULT 0,        -- centavos
  credit INTEGER DEFAULT 0,       -- centavos
  user_id UUID REFERENCES users(id),  -- a quem pertence
  reference_id UUID,              -- pagamento, repasse, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ledger_ride ON ledger_entries(ride_id);
CREATE INDEX idx_ledger_user ON ledger_entries(user_id);

-- ============================================================
-- OUTBOX (transactional outbox pattern)
-- ============================================================

CREATE TABLE outbox_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  ride_id UUID,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outbox_unpublished ON outbox_events(published) WHERE published = FALSE;

-- ============================================================
-- AUDITORIA
-- ============================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  before_data JSONB,
  after_data JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);

-- ============================================================
-- FUNÇÃO DE ATUALIZAÇÃO DE UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_rides_updated_at BEFORE UPDATE ON rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_tariffs_updated_at BEFORE UPDATE ON tariffs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
