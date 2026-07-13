-- ─────────────────────────────────────────────────────────────────────────────
-- Autenticación, roles/permisos y auditoría
--   usuarios  : cuentas (creadas sólo por el administrador). Password hasheado (bcrypt).
--   permisos  : matriz por usuario y módulo (leer / editar / eliminar).
--   auditoria : log de quién hizo qué, cuándo y sobre qué recurso.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usuarios (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  usuario         VARCHAR(50)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  nombre          VARCHAR(120),
  rol             ENUM('administrador','mandos_medios','operarios') NOT NULL DEFAULT 'operarios',
  activo          TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS permisos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT         NOT NULL,
  modulo      VARCHAR(50) NOT NULL,
  leer        TINYINT(1)  NOT NULL DEFAULT 0,
  editar      TINYINT(1)  NOT NULL DEFAULT 0,
  eliminar    TINYINT(1)  NOT NULL DEFAULT 0,
  UNIQUE KEY uq_usuario_modulo (usuario_id, modulo),
  CONSTRAINT fk_permisos_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS auditoria (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT,
  usuario     VARCHAR(50),
  accion      VARCHAR(20),   -- LOGIN / LOGOUT / CREAR / EDITAR / ELIMINAR
  modulo      VARCHAR(50),
  recurso     VARCHAR(255),  -- método + ruta afectada
  metodo      VARCHAR(10),
  detalle     TEXT,
  ip          VARCHAR(45),
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_aud_usuario (usuario_id),
  INDEX idx_aud_modulo  (modulo),
  INDEX idx_aud_accion  (accion),
  INDEX idx_aud_fecha   (creado_en),
  CONSTRAINT fk_aud_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
