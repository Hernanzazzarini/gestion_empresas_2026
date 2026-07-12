-- Módulo: Reclamos — Seguimiento de reclamos de clientes
-- Correr: mysql -u root -p gestion_empresa < gestion-app/server/sql/reclamos.sql

CREATE TABLE IF NOT EXISTS reclamos (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  nro_reclamo           VARCHAR(20)  NOT NULL UNIQUE,
  fecha_reclamo         DATE         NOT NULL,
  tipo                  ENUM('Formal','No Formal') NOT NULL,
  codigo                VARCHAR(100) NOT NULL,
  origen_cliente        VARCHAR(255) NOT NULL,
  destinatario          ENUM('Produccion','Logistica','Calidad') NOT NULL,
  lote_reclamado        VARCHAR(100) NOT NULL,
  anio_lote             INT          NOT NULL,
  motivo                ENUM('Calidad','Carga','Plagas','Envases') NOT NULL,
  descripcion           TEXT         NOT NULL,
  gravedad              ENUM('Menor','Mayor','Critico') NOT NULL,
  observaciones         TEXT,
  estado                ENUM('Abierto','En tratamiento','Cerrado') NOT NULL DEFAULT 'Abierto',
  fecha_cierre          DATE         NOT NULL,
  metodo_causa_raiz     ENUM('5porques','espina') NOT NULL DEFAULT '5porques',
  causa_raiz_data       JSON,
  accion_preventiva     TEXT,
  accion_correctiva     TEXT,
  responsable_area      VARCHAR(255) NOT NULL,
  destinatarios         TEXT,
  notificacion_enviada  TINYINT      NOT NULL DEFAULT 0,
  creado_en             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  actualizado_en        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reclamos_adjuntos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  reclamo_id      INT          NOT NULL,
  tipo            ENUM('reclamo','evidencia') NOT NULL,
  archivo_path    VARCHAR(500) NOT NULL,
  nombre_original VARCHAR(255),
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reclamo_id) REFERENCES reclamos(id) ON DELETE CASCADE
);
