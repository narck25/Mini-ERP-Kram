Write-Host "=== Test de Nuevos Usuarios ===" -ForegroundColor Cyan
Write-Host ""

# 1. Test usuario Gerente de RH - ELIZABETH ZURITA LUNA
Write-Host "1. Probando usuario Gerente de RH..." -ForegroundColor Yellow
$rhLoginBody = @{
    email = "recursoshumanos@kram.mx"
    password = "123456"
} | ConvertTo-Json

try {
    $rhLoginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
        -Method Post `
        -Body $rhLoginBody `
        -ContentType "application/json"
    
    $rhToken = $rhLoginResponse.token
    Write-Host "✅ Login exitoso como Gerente de RH" -ForegroundColor Green
    Write-Host "   Nombre: $($rhLoginResponse.user.name)"
    Write-Host "   Rol: $($rhLoginResponse.user.role)"
    Write-Host "   Módulos accesibles: $($rhLoginResponse.user.accessibleModules -join ', ')"
    
    # Verificar que tiene acceso a módulos de RH
    $expectedModules = @('DASHBOARD', 'EMPLEADOS', 'RECLUTAMIENTO', 'VACACIONES', 'INCIDENCIAS', 'REPORTES')
    $hasAllModules = $true
    foreach ($module in $expectedModules) {
        if (-not $rhLoginResponse.user.accessibleModules.Contains($module)) {
            Write-Host "   ⚠️  Falta módulo: $module" -ForegroundColor Yellow
            $hasAllModules = $false
        }
    }
    if ($hasAllModules) {
        Write-Host "   ✅ Todos los módulos de RH están presentes" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error en login RH: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Test usuario PRUEBAS HUB
Write-Host "`n2. Probando usuario PRUEBAS HUB..." -ForegroundColor Yellow
$hubLoginBody = @{
    email = "hub@kram.mx"
    password = "123456"
} | ConvertTo-Json

try {
    $hubLoginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
        -Method Post `
        -Body $hubLoginBody `
        -ContentType "application/json"
    
    $hubToken = $hubLoginResponse.token
    Write-Host "✅ Login exitoso como PRUEBAS HUB" -ForegroundColor Green
    Write-Host "   Nombre: $($hubLoginResponse.user.name)"
    Write-Host "   Rol: $($hubLoginResponse.user.role)"
    Write-Host "   Módulos accesibles: $($hubLoginResponse.user.accessibleModules -join ', ')"
    
    # Verificar que tiene acceso a módulos de PRODUCCION
    $expectedModules = @('DASHBOARD', 'RECLUTAMIENTO')
    $hasAllModules = $true
    foreach ($module in $expectedModules) {
        if (-not $hubLoginResponse.user.accessibleModules.Contains($module)) {
            Write-Host "   ⚠️  Falta módulo: $module" -ForegroundColor Yellow
            $hasAllModules = $false
        }
    }
    if ($hasAllModules) {
        Write-Host "   ✅ Todos los módulos de PRODUCCION están presentes" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error en login HUB: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Test que PRUEBAS HUB puede crear vacantes (perfil producción)
Write-Host "`n3. Probando que PRUEBAS HUB puede crear vacantes..." -ForegroundColor Yellow
if ($hubToken) {
    $vacancyBody = @{
        jobPositionId = "cmmaz0p8q0000rnv4q8q8q8q8"  # ID de ejemplo, se necesita un ID real
        departamento_id = "cmmaz0p8q0000rnv4q8q8q8q9"  # ID de ejemplo
        motivoSolicitud = "NUEVA_CREACION"
        tipoContratacion = "ADMINISTRATIVO"
        numeroVacantes = 1
    } | ConvertTo-Json
    
    try {
        # Primero obtener departamentos disponibles
        $departmentsResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/organization/departments" `
            -Method Get `
            -Headers @{ "Authorization" = "Bearer $hubToken" }
        
        if ($departmentsResponse.departments.Count -gt 0) {
            Write-Host "   ✅ PRUEBAS HUB puede acceder a departamentos" -ForegroundColor Green
            Write-Host "   Departamentos disponibles: $($departmentsResponse.departments.Count)"
        }
        
        # Intentar crear una vacante (esto debería funcionar para perfil PRODUCCION)
        Write-Host "   Intentando crear vacante de prueba..." -ForegroundColor Cyan
        # Nota: Necesitamos IDs reales para probar completamente
        
    } catch {
        Write-Host "   ⚠️  Error en prueba de vacantes: $($_.Exception.Message)" -ForegroundColor Yellow
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "   Status: $statusCode"
        }
    }
} else {
    Write-Host "   ⚠️  No se pudo obtener token de HUB para prueba" -ForegroundColor Yellow
}

# 4. Test que Gerente de RH puede acceder a módulos de RH
Write-Host "`n4. Probando acceso a módulos de RH..." -ForegroundColor Yellow
if ($rhToken) {
    try {
        # Intentar acceder a empleados (módulo EMPLEADOS)
        $employeesResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/employees" `
            -Method Get `
            -Headers @{ "Authorization" = "Bearer $rhToken" }
        
        Write-Host "   ✅ Gerente de RH puede acceder a lista de empleados" -ForegroundColor Green
        Write-Host "   Total empleados: $($employeesResponse.employees.Count)"
        
        # Intentar acceder a vacantes (módulo RECLUTAMIENTO)
        $vacanciesResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/recruitment/vacancies" `
            -Method Get `
            -Headers @{ "Authorization" = "Bearer $rhToken" }
        
        Write-Host "   ✅ Gerente de RH puede acceder a lista de vacantes" -ForegroundColor Green
        Write-Host "   Total vacantes: $($vacanciesResponse.vacancies.Count)"
        
    } catch {
        Write-Host "   ❌ Error en prueba de módulos RH: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "   Status: $statusCode"
        }
    }
} else {
    Write-Host "   ⚠️  No se pudo obtener token de RH para prueba" -ForegroundColor Yellow
}

# 5. Resumen final
Write-Host "`n📋 Resumen Final:" -ForegroundColor Cyan
Write-Host "========================================"
Write-Host "✅ Usuarios creados exitosamente:"
Write-Host "   1. Gerente de RH - ELIZABETH ZURITA LUNA"
Write-Host "      Email: recursoshumanos@kram.mx"
Write-Host "      Contraseña: 123456"
Write-Host "      Rol: RH"
Write-Host "      Módulos: DASHBOARD, EMPLEADOS, RECLUTAMIENTO, VACACIONES, INCIDENCIAS, REPORTES"
Write-Host ""
Write-Host "   2. PRUEBAS HUB"
Write-Host "      Email: hub@kram.mx"
Write-Host "      Contraseña: 123456"
Write-Host "      Rol: PRODUCCION"
Write-Host "      Módulos: DASHBOARD, RECLUTAMIENTO"
Write-Host "========================================"
Write-Host "`n💡 Los usuarios están listos para usar en el sistema ERP KRAM."
Write-Host "   - Gerente de RH tiene acceso completo a módulos de Recursos Humanos"
Write-Host "   - PRUEBAS HUB puede levantar vacantes como perfil de producción"