-- Migración: fecha límite de respuesta + alerta por vencimiento en Desvíos
--
-- Agrega el plazo de respuesta del desvío y el control de su notificación.
-- La alerta se dispara cuando faltan `dias_alerta_limite` días (o menos) para
-- `fecha_limite_respuesta`, y también cuando ya está vencida; `notificacion_limite_enviada`
-- evita que el cron la repita (se resetea al cambiar la fecha límite).
--
-- Correr: mysql -u root -p gestion_empresa < gestion-app/server/sql/desvios_fecha_limite.sql
-- (En producción, correrlo contra TiDB con los datos de conexión correspondientes.)

ALTER TABLE desvios
  ADD COLUMN fecha_limite_respuesta      DATE        AFTER fecha_estado,
  ADD COLUMN dias_alerta_limite          INT         NOT NULL DEFAULT 7 AFTER fecha_limite_respuesta,
  ADD COLUMN notificacion_limite_enviada TINYINT     NOT NULL DEFAULT 0 AFTER notificacion_enviada;
