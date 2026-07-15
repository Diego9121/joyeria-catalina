-- PREPARADA, NO APLICADA. Antes de correr esta migración en la base viva,
-- verificar que no existan duplicados:
--   SELECT codigo, COUNT(*) FROM productos GROUP BY codigo HAVING COUNT(*) > 1;
-- Si hay duplicados, resolverlos manualmente antes de aplicar el ADD CONSTRAINT.

-- +migrate up
ALTER TABLE productos ADD CONSTRAINT productos_codigo_unique UNIQUE (codigo);

-- +migrate down
ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_codigo_unique;
