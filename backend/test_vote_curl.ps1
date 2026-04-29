Write-Host "=== Test de API de Votación con PowerShell ===" -ForegroundColor Cyan
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
    Write-Host "   Token: $($token.Substring(0, 30))..."
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
    
    $candidate = $vacancy.candidatesRH[0]
    Write-Host "`n✅ Candidato para probar:" -ForegroundColor Green
    Write-Host "   ID: $($candidate.id)"
    Write-Host "   Nombre: $($candidate.nombre)"
    Write-Host "   Estatus actual: $($candidate.estatus)"
} catch {
    Write-Host "❌ Error obteniendo vacante: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 3. Probar el voto "like"
Write-Host "`n3. Probando voto 'like'..." -ForegroundColor Yellow
$voteBody = @{
    vote = "like"
} | ConvertTo-Json

try {
    $voteResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/recruitment/candidates/$($candidate.id)/vote" `
        -Method Put `
        -Body $voteBody `
        -Headers @{ 
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
    
    Write-Host "✅ Voto exitoso!" -ForegroundColor Green
    Write-Host "   Mensaje: $($voteResponse.message)"
    Write-Host "   Nuevo estatus: $($voteResponse.candidate.estatus)"
} catch {
    Write-Host "❌ Error en el voto:" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        $reader.Close()
        
        Write-Host "   Status: $statusCode"
        try {
            $errorJson = $errorBody | ConvertFrom-Json
            Write-Host "   Error: $($errorJson.error)"
            if ($errorJson.details) {
                Write-Host "   Detalles: $($errorJson.details)"
            }
        } catch {
            Write-Host "   Error body: $errorBody"
        }
    } else {
        Write-Host "   Error: $($_.Exception.Message)"
    }
}

# 4. Verificar el cambio en el candidato
Write-Host "`n4. Verificando estado actualizado del candidato..." -ForegroundColor Yellow
try {
    $updatedVacancyResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/recruitment/vacancies/cmmaz0pq5001irnv4vbou9yja" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $token" }
    
    $updatedCandidate = $updatedVacancyResponse.vacancy.candidatesRH | Where-Object { $_.id -eq $candidate.id }
    Write-Host "✅ Estado actualizado: $($updatedCandidate.estatus)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error verificando estado: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Probar el voto "dislike" (para revertir)
Write-Host "`n5. Probando voto 'dislike'..." -ForegroundColor Yellow
$dislikeBody = @{
    vote = "dislike"
} | ConvertTo-Json

try {
    $dislikeResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/recruitment/candidates/$($candidate.id)/vote" `
        -Method Put `
        -Body $dislikeBody `
        -Headers @{ 
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
    
    Write-Host "✅ Voto 'dislike' exitoso!" -ForegroundColor Green
    Write-Host "   Mensaje: $($dislikeResponse.message)"
    Write-Host "   Nuevo estatus: $($dislikeResponse.candidate.estatus)"
} catch {
    Write-Host "❌ Error en el voto 'dislike':" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        $reader.Close()
        
        Write-Host "   Status: $statusCode"
        try {
            $errorJson = $errorBody | ConvertFrom-Json
            Write-Host "   Error: $($errorJson.error)"
        } catch {
            Write-Host "   Error body: $errorBody"
        }
    } else {
        Write-Host "   Error: $($_.Exception.Message)"
    }
}

Write-Host "`n=== Test completado ===" -ForegroundColor Cyan