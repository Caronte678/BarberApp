-- ============================================================
-- AGENDA BARBERÍAS — Esquema PostgreSQL
-- Modelo multilocal: todos los datos filtrados por local_id
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- 1. LOCALES
-- Una fila por barbería cliente que contrates
-- ------------------------------------------------------------
CREATE TABLE locales (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(100) NOT NULL,
  slug        VARCHAR(60)  NOT NULL UNIQUE,  -- para URLs: /agenda/barberia-norte
  telefono    VARCHAR(20),
  plan        VARCHAR(20)  NOT NULL DEFAULT 'basico', -- basico | pro
  activo      BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. USUARIOS (secretarios / dueños del local)
-- rol: 'secretario' solo registra citas
-- rol: 'admin'      gestiona barberos, servicios, reportes
-- ------------------------------------------------------------
CREATE TABLE usuarios (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id      UUID        NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  rol           VARCHAR(20)  NOT NULL DEFAULT 'secretario', -- secretario | admin
  activo        BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 3. BARBEROS
-- Cada barbero pertenece a un local
-- ------------------------------------------------------------
CREATE TABLE barberos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id    UUID        NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
  nombre      VARCHAR(100) NOT NULL,
  telefono    VARCHAR(20),
  activo      BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 4. SERVICIOS
-- Corte, arreglo de barba, etc. Cada local define los suyos
-- ------------------------------------------------------------
CREATE TABLE servicios (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id      UUID        NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
  nombre        VARCHAR(100) NOT NULL,
  duracion_min  INT          NOT NULL DEFAULT 30,  -- duración en minutos
  precio        INT          NOT NULL DEFAULT 0,   -- en pesos CLP (sin decimales)
  activo        BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 5. HORARIOS DE TRABAJO
-- Qué días y en qué rango trabaja cada barbero
-- dia_semana: 0=domingo, 1=lunes, ..., 6=sábado
-- ------------------------------------------------------------
CREATE TABLE horarios (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  barbero_id   UUID  NOT NULL REFERENCES barberos(id) ON DELETE CASCADE,
  dia_semana   INT   NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio  TIME  NOT NULL,
  hora_fin     TIME  NOT NULL,
  CONSTRAINT horario_valido CHECK (hora_inicio < hora_fin),
  UNIQUE (barbero_id, dia_semana)  -- un horario por día por barbero
);

-- ------------------------------------------------------------
-- 6. BLOQUEOS
-- Vacaciones, feriados, pausas puntuales
-- ------------------------------------------------------------
CREATE TABLE bloqueos (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  barbero_id   UUID        NOT NULL REFERENCES barberos(id) ON DELETE CASCADE,
  fecha        DATE        NOT NULL,
  hora_inicio  TIME,        -- NULL = bloqueo día completo
  hora_fin     TIME,
  motivo       VARCHAR(200),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 7. CLIENTES
-- Se van creando/actualizando al registrar reservas
-- ------------------------------------------------------------
CREATE TABLE clientes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id      UUID        NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
  nombre        VARCHAR(100) NOT NULL,
  telefono      VARCHAR(20)  NOT NULL,
  ultima_visita DATE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (local_id, telefono)  -- un cliente por teléfono por local
);

-- ------------------------------------------------------------
-- 8. RESERVAS
-- El corazón del sistema
-- estado: pendiente | confirmada | completada | cancelada | no_show
-- ------------------------------------------------------------
CREATE TABLE reservas (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id     UUID        NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
  barbero_id   UUID        NOT NULL REFERENCES barberos(id),
  servicio_id  UUID        NOT NULL REFERENCES servicios(id),
  cliente_id   UUID        REFERENCES clientes(id),  -- puede ser NULL si no se registra cliente
  fecha        DATE        NOT NULL,
  hora_inicio  TIME        NOT NULL,
  hora_fin     TIME        NOT NULL,
  estado       VARCHAR(20) NOT NULL DEFAULT 'confirmada',
  notas        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT estado_valido CHECK (
    estado IN ('pendiente','confirmada','completada','cancelada','no_show')
  ),
  CONSTRAINT hora_reserva_valida CHECK (hora_inicio < hora_fin)
);

-- ============================================================
-- ÍNDICES — para que las consultas frecuentes sean rápidas
-- ============================================================

-- Reservas del día (la consulta más frecuente)
CREATE INDEX idx_reservas_fecha        ON reservas (local_id, fecha);
CREATE INDEX idx_reservas_barbero_dia  ON reservas (barbero_id, fecha);

-- Buscar cliente por teléfono al registrar
CREATE INDEX idx_clientes_telefono     ON clientes (local_id, telefono);

-- Horarios por barbero
CREATE INDEX idx_horarios_barbero      ON horarios (barbero_id);

-- Bloqueos por fecha
CREATE INDEX idx_bloqueos_fecha        ON bloqueos (barbero_id, fecha);

-- ============================================================
-- DATOS DE PRUEBA — para empezar a desarrollar
-- ============================================================

INSERT INTO locales (nombre, slug, telefono, plan) VALUES
  ('Barbería Demo Chillán', 'demo-chillan', '+56912345678', 'basico');

-- Obtener el ID del local recién creado para usarlo abajo
DO $$
DECLARE
  v_local UUID;
  v_barbero1 UUID;
  v_barbero2 UUID;
  v_servicio1 UUID;
  v_servicio2 UUID;
BEGIN
  SELECT id INTO v_local FROM locales WHERE slug = 'demo-chillan';

  INSERT INTO usuarios (local_id, nombre, email, password_hash, rol)
  VALUES (v_local, 'Secretaria Demo', 'demo@agenda.cl',
          '$2b$10$HASH_PLACEHOLDER', 'secretario');

  INSERT INTO barberos (local_id, nombre, telefono) VALUES
    (v_local, 'Carlos Rojas', '+56911111111') RETURNING id INTO v_barbero1;

  INSERT INTO barberos (local_id, nombre, telefono) VALUES
    (v_local, 'Felipe Muñoz', '+56922222222') RETURNING id INTO v_barbero2;

  INSERT INTO servicios (local_id, nombre, duracion_min, precio) VALUES
    (v_local, 'Corte de pelo', 30, 8000) RETURNING id INTO v_servicio1;

  INSERT INTO servicios (local_id, nombre, duracion_min, precio) VALUES
    (v_local, 'Corte + barba', 50, 12000) RETURNING id INTO v_servicio2;

  -- Horarios lunes a sábado para ambos barberos
  INSERT INTO horarios (barbero_id, dia_semana, hora_inicio, hora_fin)
  SELECT v_barbero1, d, '09:00', '19:00' FROM generate_series(1,6) d;

  INSERT INTO horarios (barbero_id, dia_semana, hora_inicio, hora_fin)
  SELECT v_barbero2, d, '10:00', '20:00' FROM generate_series(1,6) d;

END $$;

