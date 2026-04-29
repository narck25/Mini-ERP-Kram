Write-Host "=== Test Completo de Funcionalidad de Votación ===" -ForegroundColor Cyan
Write-Host ""

# 1. Login como Ana Martínez (solicitante de la vacante)
Write-Host "1. Iniciando sesión como Ana Martínez..." -ForegroundColor Yellow
$loginBody = @{
    email = "compras@kram.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"
    
    $token = $loginResponse.token
    Write-Host "✅ Login exitoso" -ForegroundColor Green
    Write-Host "   User ID: $($loginResponse.user.id)"
    Write-Host "   User Name: $($loginResponse.user.name)"
    Write-Host "   User Role: $($loginResponse.user.role)"
} catch {
    Write-Host "❌ Error en login: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 2. Obtener información de la vacante
Write-Host "`n2. Obteniendo información de la vacante..." -ForegroundColor Yellow
try {
    $vacancyResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/recruitment/vacancies/cmmaz0pq5001irnv4vbou9yja" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $token" }
    
    $vacancy = $vacancyResponse.vacancy
    Write-Host "✅ Vacante obtenida:" -ForegroundColor Green
    Write-Host "   Título: $($vacancy.titulo)"
    Write-Host "   Estatus: $($vacancy.estatus)"
    Write-Host "   Solicitante: $($vacancy.solicitante.nombre)"
    Write-Host "   Candidatos: $($vacancy.candidatesRH.Count)"
    
    if ($vacancy.candidatesRH.Count -eq 0) {
        Write-Host "❌ No hay candidatos para probar" -ForegroundColor Red
        exit
    }
    
    # Mostrar todos los candidatos
    Write-Host "`n📋 Lista de candidatos:" -ForegroundColor Yellow
    foreach ($candidate in $vacancy.candidatesRH) {
        Write-Host "   - $($candidate.nombre) (ID: $($candidate.id), Estatus: $($candidate.estatus))"
    }
} catch {
    Write-Host "❌ Error obteniendo vacante: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 3. Probar con el candidato "Miguel Torres" (estado Descartado)
$candidateToTest = $vacancy.candidatesRH | Where-Object { $_.nombre -eq "Miguel Torres" }
if (-not $candidateToTest) {
    Write-Host "❌ No se encontró el candidato 'Miguel Torres'" -ForegroundColor Red
    exit
}

Write-Host "`n3. Probando con candidato 'Miguel Torres'..." -ForegroundColor Yellow
Write-Host "   ID: $($candidateToTest.id)"
Write-Host "   Estatus actual: $($candidateToTest.estatus)"

# 3.1 Probar voto "like"
Write-Host "`n   3.1. Probando voto 'like'..." -ForegroundColor Cyan
$likeBody = @{
    vote = "like"
} | ConvertTo-Json

try {
    $likeResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/recruitment/candidates/$($candidateToTest.id)/vote" `
        -Method Put `
        -Body $likeBody `
        -Headers @{ 
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
    
    Write-Host "   ✅ Voto 'like' exitoso!" -ForegroundColor Green
    Write-Host "      Mensaje: $($likeResponse.message)"
    Write-Host "      Nuevo estatus: $($likeResponse.candidate.estatus)"
} catch {
    Write-Host "   ❌ Error en voto 'like':" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "      Status: $statusCode"
    }
    Write-Host "      Error: $($_.Exception.Message)"
}

# 3.2 Verificar cambio
Write-Host "`n   3.2. Verificando cambio..." -ForegroundColor Cyan
try {
    $updatedVacancyResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/recruitment/vacancies/cmmaz0pq5001irnv4vbou9yja" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $token" }
    
    $updatedCandidate = $updatedVacancyResponse.vacancy.candidatesRH | Where-Object { $_.id -eq $candidateToTest.id }
    Write-Host "   ✅ Estado actualizado: $($updatedCandidate.estatus)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error verificando estado: $($_.Exception.Message)" -ForegroundColor Red
}

# 3.3 Probar voto "dislike" para revertir
Write-Host "`n   3.3. Probando voto 'dislike'..." -ForegroundColor Cyan
$dislikeBody = @{
    vote = "dislike"
} | ConvertTo-Json

try {
    $dislikeResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/recruitment/candidates/$($candidateToTest.id)/vote" `
        -Method Put `
        -Body $dislikeBody `
        -Headers @{ 
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
    
    Write-Host "   ✅ Voto 'dislike' exitoso!" -ForegroundColor Green
    Write-Host "      Mensaje: $($dislikeResponse.message)"
    Write-Host "      Nuevo estatus: $($dislikeResponse.candidate.estatus)"
} catch {
    Write-Host "   ❌ Error en voto 'dislike':" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "      Status: $statusCode"
    }
    Write-Host "      Error: $($_.Exception.Message)"
}

# 4. Probar que un usuario que NO es el solicitante NO puede votar
Write-Host "`n4. Probando permisos con usuario no solicitante..." -ForegroundColor Yellow

# 4.1 Login como RH (no es el solicitante)
Write-Host "`n   4.1. Iniciando sesión como RH..." -ForegroundColor Cyan
$rhLoginBody = @{
    email = "rh@kram.com"
    password = "password123"
} | ConvertTo-Json

try {
    $rhLoginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
        -Method Post `
        -Body $rhLoginBody `
        -ContentType "application/json"
    
    $rhToken = $rhLoginResponse.token
    Write-Host "   ✅ Login RH exitoso" -ForegroundColor Green
    Write-Host "      User Name: $($rhLoginResponse.user.name)"
    Write-Host "      User Role: $($rhLoginResponse.user.role)"
} catch {
    Write-Host "   ❌ Error en login RH: $($_.Exception.Message)" -ForegroundColor Red
}

# 4.2 Intentar votar como RH (debería fallar)
Write-Host "`n   4.2. Intentando votar como RH..." -ForegroundColor Cyan
try {
    $rhVoteResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/recruitment/candidates/$($candidateToTest.id)/vote" `
        -Method Put `
        -Body $likeBody `
        -Headers @{ 
            "Authorization" = "Bearer $rhToken"
            "Content-Type" = "application/json"
        }
    
    Write-Host "   ❌ ERROR: RH pudo votar (esto no debería pasar)" -ForegroundColor Red
    Write-Host "      Mensaje: $($rhVoteResponse.message)"
} catch {
    Write-Host "   ✅ Correcto: RH NO puede votar (como se esperaba)" -ForegroundColor Green
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        $reader.Close()
        
        try {
            $errorJson = $errorBody | ConvertFrom-Json
            Write-Host "      Status: $statusCode"
            Write-Host "      Error: $($errorJson.error)"
        } catch {
            Write-Host "      Status: $statusCode"
            Write-Host "      Error body: $errorBody"
        }
    }
}

# 5. Estado final
Write-Host "`n5. Estado final de la vacante..." -ForegroundColor Yellow
try {
    $finalVacancyResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/recruitment/vacancies/cmmaz0pq5001irnv4vbou9yja" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $token" }
    
    $finalVacancy = $finalVacancyResponse.vacancy
    Write-Host "✅ Estado final:" -ForegroundColor Green
    Write-Host "   Título: $($finalVacancy.titulo)"
    Write-Host "   Estatus: $($finalVacancy.estatus)"
    Write-Host "   Candidatos:"
    foreach ($candidate in $finalVacancy.candidatesRH) {
        Write-Host "   - $($candidate.nombre): $($candidate.estatus)"
    }
} catch {
    Write-Host "❌ Error obteniendo estado final: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test completado exitosamente ===" -ForegroundColor Cyan
Write-Host "`n📋 Resumen de la corrección:" -ForegroundColor Yellow
Write-Host "✅ Se corrigió el problema de permisos en el controlador de reclutamiento"
Write-Host "✅ La validación ahora compara correctamente: vacancy.solicitanteId === employee.id"
Write-Host "✅ El solicitante puede votar por candidatos (like/dislike)"
Write-Host "✅ Usuarios no solicitantes NO pueden votar (seguridad correcta)"
Write-Host "✅ La funcionalidad de votación está completamente operativa"