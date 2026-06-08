-- 1. Ver los IDs completos de ambos empleados
SELECT id, clave, nombre, "nivelJerarquico" FROM "employees" WHERE clave IN ('576', '616');

-- 2. Actualizar RH a PRESIDENTE
UPDATE "employees" SET "nivelJerarquico" = 'PRESIDENTE' WHERE clave = '576';

-- 3. Actualizar Auxiliar a DIRECTOR y que reporte a RH
UPDATE "employees" SET "nivelJerarquico" = 'DIRECTOR', "reportaAId" = (SELECT id FROM "employees" WHERE clave = '576') WHERE clave = '616';

-- 4. Verificar resultados
SELECT e.clave, e.nombre, e."nivelJerarquico", j.nombre as jefe, j."nivelJerarquico" as nivel_jefe
FROM "employees" e
LEFT JOIN "employees" j ON e."reportaAId" = j.id
WHERE e.clave IN ('576', '616');
