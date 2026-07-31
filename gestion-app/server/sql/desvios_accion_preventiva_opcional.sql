-- Migración: la acción preventiva pasa a ser opcional en Desvíos
--
-- `descripcion` sigue siendo obligatoria (NOT NULL, sin cambios); `accion_preventiva`
-- deja de serlo, así se puede registrar un desvío sin definir todavía la acción preventiva.
--
-- Correr: mysql -u root -p gestion_empresa < gestion-app/server/sql/desvios_accion_preventiva_opcional.sql
-- (En producción, ejecutarlo en el SQL Editor de TiDB precedido de: USE gestion_empresa;)

ALTER TABLE desvios
  MODIFY COLUMN accion_preventiva TEXT NULL;
