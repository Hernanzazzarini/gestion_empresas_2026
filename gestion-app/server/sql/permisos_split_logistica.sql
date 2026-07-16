-- Migración: separar el módulo 'logistica' en 'contenedores' y 'stock'.
--
-- Antes, un único permiso 'logistica' gobernaba Control de Contenedores,
-- Control de Stock y Reporte de Stock. Ahora son dos módulos independientes.
--
-- Cada usuario hereda en ambas claves nuevas los mismos permisos que tenía en
-- 'logistica', de modo que nadie gana ni pierde acceso con la migración; a
-- partir de ahí el admin puede ajustarlos por separado.
--
-- Es idempotente: se puede correr más de una vez sin efectos adicionales.

INSERT INTO permisos (usuario_id, modulo, leer, editar, eliminar)
SELECT usuario_id, 'contenedores', leer, editar, eliminar
FROM (SELECT * FROM permisos WHERE modulo = 'logistica') AS origen
ON DUPLICATE KEY UPDATE
  leer = VALUES(leer), editar = VALUES(editar), eliminar = VALUES(eliminar);

INSERT INTO permisos (usuario_id, modulo, leer, editar, eliminar)
SELECT usuario_id, 'stock', leer, editar, eliminar
FROM (SELECT * FROM permisos WHERE modulo = 'logistica') AS origen
ON DUPLICATE KEY UPDATE
  leer = VALUES(leer), editar = VALUES(editar), eliminar = VALUES(eliminar);

-- Ya migradas: la clave 'logistica' no se usa más para permisos.
-- (Los registros de auditoría con modulo='logistica' NO se tocan: son historial.)
DELETE FROM permisos WHERE modulo = 'logistica';