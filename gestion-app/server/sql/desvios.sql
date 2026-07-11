-- Módulo: Desvíos — Acciones Correctivas/Preventivas
-- Correr: mysql -u root -p gestion_empresa < gestion-app/server/sql/desvios.sql

CREATE TABLE IF NOT EXISTS desvios (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  nro_desvio              VARCHAR(20)  NOT NULL UNIQUE,
  fecha                   DATE         NOT NULL,
  anio                    INT          NOT NULL,
  origen                  ENUM('I','AI','OD','AE','PostPCC') NOT NULL,
  area                    ENUM('Calidad','Logistica','Mantenimiento','Inocuidad','Produccion') NOT NULL,
  descripcion             TEXT         NOT NULL,
  accion_correctiva       TEXT         NOT NULL,
  responsable_correctiva  VARCHAR(255) NOT NULL,
  metodo_causa_raiz       ENUM('5porques','espina') NOT NULL DEFAULT '5porques',
  causa_raiz_data         JSON,
  accion_preventiva       TEXT         NOT NULL,
  gravedad                ENUM('Menor','Mayor','Critico') NOT NULL,
  responsable_verificar   VARCHAR(255) NOT NULL,
  estado                  ENUM('Abierto','En tratamiento','Cerrado') NOT NULL DEFAULT 'Abierto',
  fecha_estado            DATE         NOT NULL,
  destinatarios           TEXT,
  notificacion_enviada    TINYINT      NOT NULL DEFAULT 0,
  creado_en               TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  actualizado_en          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS desvios_evidencias (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  desvio_id       INT          NOT NULL,
  tipo            ENUM('antes','despues') NOT NULL,
  archivo_path    VARCHAR(500) NOT NULL,
  nombre_original VARCHAR(255),
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (desvio_id) REFERENCES desvios(id) ON DELETE CASCADE
);
