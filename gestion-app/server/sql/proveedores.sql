-- ─────────────────────────────────────────────────────────────────────────────
-- Módulo: Seguimiento de Proveedores
-- Ejecutar manualmente contra la base `gestion_empresa` (no hay migraciones).
--   mysql -u root -p gestion_empresa < server/sql/proveedores.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Datos del proveedor
CREATE TABLE IF NOT EXISTS proveedores (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  nombre                VARCHAR(255)                     NOT NULL,
  tipo_proveedor        ENUM('insumos_mp', 'servicios')  NOT NULL,
  tipo_insumo_servicio  VARCHAR(255)                     NOT NULL,
  ciudad                VARCHAR(255)                     NOT NULL,
  provincia             VARCHAR(255)                     NULL,
  persona_contacto      VARCHAR(255)                     NOT NULL,
  telefono              VARCHAR(100)                     NULL,
  email                 VARCHAR(255)                     NOT NULL,
  observaciones         TEXT                             NULL,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentación adjunta (relación 1 a muchos con proveedores)
CREATE TABLE IF NOT EXISTS proveedores_documentos (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  proveedor_id         INT                                          NOT NULL,
  nombre               VARCHAR(255)                                 NOT NULL,
  archivo_path         VARCHAR(500)                                 NULL,
  archivo_nombre       VARCHAR(500)                                 NULL,
  fecha_vencimiento    DATE                                         NULL,
  observaciones        TEXT                                         NULL,
  -- Módulo de alertas (solo aplica si hay fecha_vencimiento)
  dias_alerta          INT DEFAULT 30,
  area_responsable     ENUM('inocuidad', 'logistica', 'produccion') NULL,
  nombre_responsable   VARCHAR(255)                                 NULL,
  destinatarios_email  TEXT                                         NULL,
  notificacion_enviada TINYINT DEFAULT 0,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_documento_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE CASCADE
);

CREATE INDEX idx_prov_doc_proveedor ON proveedores_documentos (proveedor_id);
CREATE INDEX idx_prov_doc_vencimiento ON proveedores_documentos (fecha_vencimiento);