-- Seed de demonstração — Mobilidade Regional (Macaé/RJ)
-- ⚠ DADOS FICTÍCIOS — APENAS PARA DESENVOLVIMENTO

-- ============================================================
-- CIDADE
-- ============================================================
INSERT INTO cities (id, name, state, timezone, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Macaé', 'RJ', 'America/Sao_Paulo', true);

-- ============================================================
-- CATEGORIAS
-- ============================================================
INSERT INTO categories (id, slug, display_name, description, max_passengers, requires_motorcycle_license, sort_order, is_active) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'economy_car', 'Econômico', 'Viagens acessíveis em carros populares', 4, false, 1, true),
  ('b1000000-0000-0000-0000-000000000002', 'comfort_car', 'Conforto', 'Carros espaçosos e com ar-condicionado', 4, false, 2, true),
  ('b1000000-0000-0000-0000-000000000003', 'executive_car', 'Executivo', 'Sedãs premium para viagens especiais', 4, false, 3, true),
  ('b1000000-0000-0000-0000-000000000004', 'moto', 'Moto', 'Transporte ágil por motocicleta', 1, true, 4, true);

-- Ativar categorias na cidade
INSERT INTO city_categories (city_id, category_id, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', true),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', true),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', true),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004', true);

-- ============================================================
-- TARIFAS (valores em centavos)
-- ============================================================
-- Econômico
INSERT INTO tariffs (city_id, category_id, base_fare, per_km, per_minute, minimum_fare,
  wait_free_minutes, wait_per_minute, cancellation_fee, cancellation_free_seconds,
  platform_commission_rate, is_active, version) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   400, 200, 30, 1000, 5, 50, 500, 120, 0.2000, true, 1);

-- Conforto
INSERT INTO tariffs (city_id, category_id, base_fare, per_km, per_minute, minimum_fare,
  wait_free_minutes, wait_per_minute, cancellation_fee, cancellation_free_seconds,
  platform_commission_rate, is_active, version) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002',
   600, 280, 40, 1500, 5, 60, 700, 120, 0.2000, true, 1);

-- Executivo
INSERT INTO tariffs (city_id, category_id, base_fare, per_km, per_minute, minimum_fare,
  wait_free_minutes, wait_per_minute, cancellation_fee, cancellation_free_seconds,
  platform_commission_rate, is_active, version) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003',
   900, 380, 55, 2000, 5, 80, 1000, 120, 0.2000, true, 1);

-- Moto
INSERT INTO tariffs (city_id, category_id, base_fare, per_km, per_minute, minimum_fare,
  wait_free_minutes, wait_per_minute, cancellation_fee, cancellation_free_seconds,
  platform_commission_rate, is_active, version) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004',
   300, 150, 20, 700, 3, 40, 400, 120, 0.1500, true, 1);

-- ============================================================
-- USUÁRIOS DE DEMONSTRAÇÃO
-- ============================================================
-- Senha: 123456 → hash bcrypt
-- Admin
INSERT INTO users (id, phone, phone_verified, name, email, role, password_hash, is_active) VALUES
  ('c1000000-0000-0000-0000-000000000001', '+5522999990001', true, 'Admin Demo', 'admin@mobilidade.local', 'owner',
   '$2a$10$rQ4F9yG7e5rQzHw5V7N5wOe8J5rQzHw5V7N5wOe8J5rQzHw5V7N5w', true);

-- Cliente 1
INSERT INTO users (id, phone, phone_verified, name, role, is_active) VALUES
  ('c1000000-0000-0000-0000-000000000010', '+5522999990010', true, 'Maria Silva', 'customer', true);
INSERT INTO customers (id, user_id) VALUES
  ('d1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000010');

-- Cliente 2
INSERT INTO users (id, phone, phone_verified, name, role, is_active) VALUES
  ('c1000000-0000-0000-0000-000000000011', '+5522999990011', true, 'João Santos', 'customer', true);
INSERT INTO customers (id, user_id) VALUES
  ('d1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000011');

-- Motorista 1 (carro)
INSERT INTO users (id, phone, phone_verified, name, role, is_active) VALUES
  ('c1000000-0000-0000-0000-000000000020', '+5522999990020', true, 'Carlos Motorista', 'driver', true);
INSERT INTO drivers (id, user_id, cpf, cnh_number, cnh_category, cnh_expiry, status, city_id) VALUES
  ('e1000000-0000-0000-0000-000000000020', 'c1000000-0000-0000-0000-000000000020',
   '123.456.789-00', '12345678900', 'B', '2027-12-31', 'approved',
   'a1000000-0000-0000-0000-000000000001');
INSERT INTO vehicles (id, driver_id, category_id, brand, model, year, color, plate, is_approved, is_active) VALUES
  ('f1000000-0000-0000-0000-000000000020', 'e1000000-0000-0000-0000-000000000020',
   'b1000000-0000-0000-0000-000000000001', 'Chevrolet', 'Onix', 2023, 'Prata', 'RIO1A23', true, true);
UPDATE drivers SET active_vehicle_id = 'f1000000-0000-0000-0000-000000000020' 
  WHERE id = 'e1000000-0000-0000-0000-000000000020';

-- Motorista 2 (carro)
INSERT INTO users (id, phone, phone_verified, name, role, is_active) VALUES
  ('c1000000-0000-0000-0000-000000000021', '+5522999990021', true, 'Ana Motorista', 'driver', true);
INSERT INTO drivers (id, user_id, cpf, cnh_number, cnh_category, cnh_expiry, status, city_id) VALUES
  ('e1000000-0000-0000-0000-000000000021', 'c1000000-0000-0000-0000-000000000021',
   '987.654.321-00', '98765432100', 'AB', '2028-06-15', 'approved',
   'a1000000-0000-0000-0000-000000000001');
INSERT INTO vehicles (id, driver_id, category_id, brand, model, year, color, plate, is_approved, is_active) VALUES
  ('f1000000-0000-0000-0000-000000000021', 'e1000000-0000-0000-0000-000000000021',
   'b1000000-0000-0000-0000-000000000001', 'Volkswagen', 'Polo', 2024, 'Branco', 'MAC2B34', true, true);
UPDATE drivers SET active_vehicle_id = 'f1000000-0000-0000-0000-000000000021' 
  WHERE id = 'e1000000-0000-0000-0000-000000000021';

-- Motorista 3 (moto)
INSERT INTO users (id, phone, phone_verified, name, role, is_active) VALUES
  ('c1000000-0000-0000-0000-000000000022', '+5522999990022', true, 'Pedro Mototáxi', 'driver', true);
INSERT INTO drivers (id, user_id, cpf, cnh_number, cnh_category, cnh_expiry, status, city_id) VALUES
  ('e1000000-0000-0000-0000-000000000022', 'c1000000-0000-0000-0000-000000000022',
   '456.789.123-00', '45678912300', 'A', '2027-09-30', 'approved',
   'a1000000-0000-0000-0000-000000000001');
INSERT INTO vehicles (id, driver_id, category_id, brand, model, year, color, plate, is_approved, is_active) VALUES
  ('f1000000-0000-0000-0000-000000000022', 'e1000000-0000-0000-0000-000000000022',
   'b1000000-0000-0000-0000-000000000004', 'Honda', 'CG 160', 2024, 'Vermelho', 'MOT3C45', true, true);
UPDATE drivers SET active_vehicle_id = 'f1000000-0000-0000-0000-000000000022'
  WHERE id = 'e1000000-0000-0000-0000-000000000022';
