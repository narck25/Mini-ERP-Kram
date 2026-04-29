# Script PowerShell para crear el usuario Mario Alberto Negrete Sanchez
Write-Host "🚀 CREANDO USUARIO MARIO ALBERTO NEGRETE SANCHEZ" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio backend
Set-Location "c:\xampp\htdocs\Mini-ERP-Kram\backend"

# Ejecutar el script de creación de usuarios adicionales
Write-Host "🔍 Ejecutando script de creación de usuarios..." -ForegroundColor Yellow
node scripts/crear-usuarios-adicionales.js

Write-Host ""
Write-Host "✅ Proceso completado." -ForegroundColor Green
Write-Host ""
Write-Host "📋 CREDENCIALES DE ACCESO:" -ForegroundColor Cyan
Write-Host "   • Nombre: Mario Alberto Negrete Sanchez"
Write-Host "   • Email: mario.negrete@kram.mx"
Write-Host "   • Contraseña: Kram2024!"
Write-Host "   • Rol: PRODUCCION (GERENTE)"
Write-Host "   • Puesto: COORDINADOR DE PROMOTORIA"
Write-Host "   • Departamento: PROMOTORIA"
Write-Host ""
Write-Host "🎯 El usuario ahora debería ser visible en el módulo de empleados." -ForegroundColor Green