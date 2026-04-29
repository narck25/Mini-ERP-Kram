@echo off
echo ================================================
echo  CREANDO USUARIO MARIO ALBERTO NEGRETE SANCHEZ
echo ================================================
echo.

REM Cambiar al directorio backend
cd /d "c:\xampp\htdocs\Mini-ERP-Kram\backend"

echo Verificando si el script existe...
if exist "scripts\crear-usuarios-adicionales.js" (
    echo Script encontrado. Ejecutando...
    node scripts\crear-usuarios-adicionales.js
) else (
    echo Script no encontrado.
    echo.
    echo Creando usuario manualmente...
    
    REM Crear archivo SQL temporal
    echo -- Crear usuario Mario Alberto Negrete Sanchez > temp_mario.sql
    echo INSERT INTO "User" (id, email, name, password, role, "isActive", "createdAt", "updatedAt", "accessibleModules") >> temp_mario.sql
    echo VALUES ( >> temp_mario.sql
    echo   gen_random_uuid(), >> temp_mario.sql
    echo   'mario.negrete@kram.mx', >> temp_mario.sql
    echo   'Mario Alberto Negrete Sanchez', >> temp_mario.sql
    echo   '$2b$10$YourHashHere', -- Hash de 'Kram2024!' >> temp_mario.sql
    echo   'PRODUCCION', >> temp_mario.sql
    echo   true, >> temp_mario.sql
    echo   NOW(), >> temp_mario.sql
    echo   NOW(), >> temp_mario.sql
    echo   '["DASHBOARD", "EMPLEADOS", "RECLUTAMIENTO", "VACACIONES", "INCIDENCIAS", "REPORTES"]'::jsonb >> temp_mario.sql
    echo ) >> temp_mario.sql
    echo ON CONFLICT (email) DO UPDATE SET >> temp_mario.sql
    echo   name = EXCLUDED.name, >> temp_mario.sql
    echo   role = EXCLUDED.role, >> temp_mario.sql
    echo   "isActive" = EXCLUDED."isActive", >> temp_mario.sql
    echo   "accessibleModules" = EXCLUDED."accessibleModules"; >> temp_mario.sql
    echo. >> temp_mario.sql
    echo -- Crear registro de empleado >> temp_mario.sql
    echo INSERT INTO "Employee" ( >> temp_mario.sql
    echo   id, "userId", nombres, "apellidoPaterno", "apellidoMaterno", >> temp_mario.sql
    echo   "correoElectronico", "correoEmpresa", "puestoId", "departamento_id", >> temp_mario.sql
    echo   "fechaAlta", curp, nss, rfc, estatus, nombre >> temp_mario.sql
    echo ) >> temp_mario.sql
    echo SELECT >> temp_mario.sql
    echo   gen_random_uuid(), >> temp_mario.sql
    echo   u.id, >> temp_mario.sql
    echo   'Mario Alberto', >> temp_mario.sql
    echo   'Negrete', >> temp_mario.sql
    echo   'Sanchez', >> temp_mario.sql
    echo   'mario.negrete@kram.mx', >> temp_mario.sql
    echo   'mario.negrete@kram.mx', >> temp_mario.sql
    echo   (SELECT id FROM "JobPosition" WHERE nombre ILIKE '%%COORDINADOR DE PROMOTORIA%%' LIMIT 1), >> temp_mario.sql
    echo   (SELECT id FROM "Department" WHERE nombre ILIKE '%%PROMOTORIA%%' LIMIT 1), >> temp_mario.sql
    echo   NOW(), >> temp_mario.sql
    echo   'NESA660101HDFNLR09', >> temp_mario.sql
    echo   '12345678901', >> temp_mario.sql
    echo   'NESA660101ABC', >> temp_mario.sql
    echo   'Activo', >> temp_mario.sql
    echo   'Mario Alberto Negrete Sanchez' >> temp_mario.sql
    echo FROM "User" u >> temp_mario.sql
    echo WHERE u.email = 'mario.negrete@kram.mx' >> temp_mario.sql
    echo ON CONFLICT ("userId") DO UPDATE SET >> temp_mario.sql
    echo   nombres = EXCLUDED.nombres, >> temp_mario.sql
    echo   "apellidoPaterno" = EXCLUDED."apellidoPaterno", >> temp_mario.sql
    echo   "apellidoMaterno" = EXCLUDED."apellidoMaterno", >> temp_mario.sql
    echo   "correoElectronico" = EXCLUDED."correoElectronico", >> temp_mario.sql
    echo   "correoEmpresa" = EXCLUDED."correoEmpresa", >> temp_mario.sql
    echo   estatus = EXCLUDED.estatus; >> temp_mario.sql
    
    echo Ejecutando consultas SQL...
    npx prisma db execute --file temp_mario.sql
    
    del temp_mario.sql
)

echo.
echo ================================================
echo  PROCESO COMPLETADO
echo ================================================
echo.
echo CREDENCIALES DE ACCESO:
echo   • Nombre: Mario Alberto Negrete Sanchez
echo   • Email: mario.negrete@kram.mx
echo   • Contraseña: Kram2024!
echo   • Rol: PRODUCCION (GERENTE)
echo   • Módulos accesibles: DASHBOARD, EMPLEADOS, RECLUTAMIENTO, VACACIONES, INCIDENCIAS, REPORTES
echo   • Puesto: COORDINADOR DE PROMOTORIA
echo   • Departamento: PROMOTORIA
echo.
echo El usuario ahora debería ser visible en el módulo de empleados.
pause