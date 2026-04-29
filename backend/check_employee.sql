-- Verificar si el empleado existe en la base de datos
SELECT 
    id,
    nombres,
    apellidoPaterno,
    apellidoMaterno,
    correoElectronico,
    correoEmpresa,
    estatus,
    fechaAlta,
    puestoId,
    departamento_id
FROM "Employee"
WHERE 
    (correoElectronico = 'mario.negrete@kram.mx' OR correoEmpresa = 'mario.negrete@kram.mx')
    OR (nombres LIKE '%Mario%' AND apellidoPaterno LIKE '%Negrete%' AND apellidoMaterno LIKE '%Sanchez%')
ORDER BY fechaAlta DESC
LIMIT 10;
