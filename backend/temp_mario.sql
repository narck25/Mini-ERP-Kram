VALUES ( 
  gen_random_uuid(), 
  'mario.negrete@kram.mx', 
  'Mario Alberto Negrete Sanchez', 
  '$2b$10$YourHashHere', -- Hash de 'Kram2024!' 
  'PRODUCCION', 
  true, 
  NOW(), 
  NOW(), 
  '["DASHBOARD", "EMPLEADOS", "RECLUTAMIENTO", "VACACIONES", "INCIDENCIAS", "REPORTES"]'::jsonb 
) 
ON CONFLICT (email) DO UPDATE SET 
  name = EXCLUDED.name, 
  role = EXCLUDED.role, 
  "isActive" = EXCLUDED."isActive", 
  "accessibleModules" = EXCLUDED."accessibleModules"; 
 
-- Crear registro de empleado 
INSERT INTO "Employee" ( 
  id, "userId", nombres, "apellidoPaterno", "apellidoMaterno", 
  "correoElectronico", "correoEmpresa", "puestoId", "departamento_id", 
  "fechaAlta", curp, nss, rfc, estatus, nombre 
) 
SELECT 
  gen_random_uuid(), 
  u.id, 
  'Mario Alberto', 
  'Negrete', 
  'Sanchez', 
  'mario.negrete@kram.mx', 
  'mario.negrete@kram.mx', 
  (SELECT id FROM "JobPosition" WHERE nombre ILIKE '%COORDINADOR DE PROMOTORIA%' LIMIT 1), 
  (SELECT id FROM "Department" WHERE nombre ILIKE '%PROMOTORIA%' LIMIT 1), 
  NOW(), 
  'NESA660101HDFNLR09', 
  '12345678901', 
  'NESA660101ABC', 
  'Activo', 
  'Mario Alberto Negrete Sanchez' 
FROM "User" u 
WHERE u.email = 'mario.negrete@kram.mx' 
ON CONFLICT ("userId") DO UPDATE SET 
  nombres = EXCLUDED.nombres, 
  "apellidoPaterno" = EXCLUDED."apellidoPaterno", 
  "apellidoMaterno" = EXCLUDED."apellidoMaterno", 
  "correoElectronico" = EXCLUDED."correoElectronico", 
  "correoEmpresa" = EXCLUDED."correoEmpresa", 
  estatus = EXCLUDED.estatus; 
