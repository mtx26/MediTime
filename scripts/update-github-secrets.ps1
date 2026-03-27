# Script pour mettre a jour les secrets GitHub a partir du fichier .env
# Prerequis: GitHub CLI (gh) installe et authentifie

param(
    [string]$Owner = "mtx26",
    [string]$Repo = "medic",
    [string]$EnvFile = "..\..\backend\.env"
)

Write-Host "Mise a jour des secrets GitHub pour $Owner/$Repo" -ForegroundColor Cyan

# Verifier si GitHub CLI est installe
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "GitHub CLI (gh) n'est pas installe." -ForegroundColor Red
    Write-Host "Installez-le avec: winget install GitHub.cli" -ForegroundColor Yellow
    exit 1
}

# Verifier l'authentification
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Vous n'etes pas authentifie avec GitHub CLI." -ForegroundColor Red
    Write-Host "Executez: gh auth login" -ForegroundColor Yellow
    exit 1
}

# Verifier que le fichier .env existe
if (-not (Test-Path $EnvFile)) {
    Write-Host "Fichier .env introuvable: $EnvFile" -ForegroundColor Red
    exit 1
}

Write-Host "Lecture du fichier .env..." -ForegroundColor Yellow

# Parser le fichier .env
$secrets = @{}
$content = Get-Content $EnvFile -Raw

# Regex pour capturer les variables d'environnement (y compris multilignes pour JSON)
$lines = $content -split "`n"
$currentKey = $null
$currentValue = ""
$inMultiline = $false

foreach ($line in $lines) {
    $line = $line.Trim()
    
    # Ignorer les commentaires et lignes vides
    if ($line -match '^#' -or $line -eq "") {
        continue
    }
    
    # Detecter une nouvelle variable
    if ($line -match '^([A-Z_][A-Z0-9_]*)=(.*)$') {
        # Sauvegarder la variable precedente si elle existe
        if ($currentKey) {
            $secrets[$currentKey] = $currentValue.Trim()
        }
        
        $currentKey = $matches[1]
        $currentValue = $matches[2]
        
        # Verifier si c'est un JSON multiligne
        if ($currentValue -match '^\{' -and $currentValue -notmatch '\}$') {
            $inMultiline = $true
        } else {
            $inMultiline = $false
        }
    }
    # Continuer a lire une valeur multiligne
    elseif ($inMultiline) {
        $currentValue += "`n" + $line
        if ($line -match '\}$') {
            $inMultiline = $false
        }
    }
}

# Sauvegarder la derniere variable
if ($currentKey) {
    $secrets[$currentKey] = $currentValue.Trim()
}

Write-Host "$($secrets.Count) variables trouvees dans le .env" -ForegroundColor Green

# Mettre a jour chaque secret
$total = $secrets.Count
$current = 0

foreach ($secretName in $secrets.Keys) {
    $current++
    Write-Host "[$current/$total] Mise a jour de $secretName..." -ForegroundColor Yellow
    
    $secretValue = $secrets[$secretName]
    
    # Utiliser gh secret set
    $secretValue | gh secret set $secretName --repo "$Owner/$Repo"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $secretName mis a jour" -ForegroundColor Green
    } else {
        Write-Host "  Erreur lors de la mise a jour de $secretName" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Tous les secrets ont ete traites!" -ForegroundColor Green
$url = "https://github.com/$Owner/$Repo/settings/secrets/actions"
Write-Host "Verifiez sur: $url" -ForegroundColor Cyan
