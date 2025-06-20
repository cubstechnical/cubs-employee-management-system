# n8n Direct Installation Script for Windows
# This installs n8n directly via Node.js (no Docker required)

Write-Host "🚀 Installing n8n directly via Node.js..." -ForegroundColor Green

# Check if Node.js is installed
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js first:" -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "   Choose LTS version (recommended)" -ForegroundColor Yellow
    exit 1
}

# Check Node.js version
$nodeVersion = node --version
Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green

# Check if npm is available
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm is not available. Please reinstall Node.js" -ForegroundColor Red
    exit 1
}

# Create n8n directory
$n8nDir = ".\n8n-installation"
if (!(Test-Path $n8nDir)) {
    New-Item -ItemType Directory -Path $n8nDir | Out-Null
    Write-Host "✅ Created n8n directory: $n8nDir" -ForegroundColor Green
}

# Change to n8n directory
Set-Location $n8nDir

# Install n8n globally
Write-Host "📦 Installing n8n globally..." -ForegroundColor Yellow
npm install -g n8n

# Create n8n configuration file
$n8nConfig = @"
# n8n Configuration for CUBS Employee Management System
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=cubs_n8n_2024_secure
N8N_ENCRYPTION_KEY=7cf7bda7e8a516a50464757b02f99f73
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
WEBHOOK_URL=http://localhost:5678/
GENERIC_TIMEZONE=Asia/Kolkata
N8N_METRICS=true
N8N_SECURE_COOKIE=false

# Database (SQLite for simplicity)
DB_TYPE=sqlite
DB_SQLITE_DATABASE=./n8n.db

# Your CUBS credentials
SUPABASE_URL=https://tndfjsjemqjgagtsqudr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGZqc2plbXFqZ2FndHNxdWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4ODQ1MDMsImV4cCI6MjA2NTQ2MDUwM30.jcPuX4IVgeCIwHuc53RiXhIm9yzMXYepgSzZ8QYu1iA
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGZqc2plbXFqZ2FndHNxdWRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg4NDUwMywiZXhwIjoyMDY1NDYwNTAzfQ.NkSiQS7MeUXk0Am5zwMfqi1r-W_TTlqaVCc7idSvd9g
SENDGRID_API_KEY=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
SENDGRID_FROM_EMAIL=technicalcubs@gmail.com
BACKBLAZE_APPLICATION_KEY_ID=005777f1de8041c0000000001
BACKBLAZE_APPLICATION_KEY=K005atrNvhb2raSkcqcpIAM6PsbUPco
"@

$n8nConfig | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ Created n8n configuration file" -ForegroundColor Green

# Create start script
$startScript = @"
@echo off
echo Starting n8n for CUBS Employee Management System...
echo.
echo Access URL: http://localhost:5678
echo Username: admin
echo Password: cubs_n8n_2024_secure
echo.
echo Press Ctrl+C to stop n8n
echo.
n8n start
"@

$startScript | Out-File -FilePath "start-n8n.bat" -Encoding ASCII
Write-Host "✅ Created start script: start-n8n.bat" -ForegroundColor Green

# Create stop script
$stopScript = @"
@echo off
echo Stopping n8n...
taskkill /f /im node.exe
echo n8n stopped.
pause
"@

$stopScript | Out-File -FilePath "stop-n8n.bat" -Encoding ASCII
Write-Host "✅ Created stop script: stop-n8n.bat" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 n8n installation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run: .\start-n8n.bat" -ForegroundColor Yellow
Write-Host "2. Open browser: http://localhost:5678" -ForegroundColor Yellow
Write-Host "3. Login with: admin / cubs_n8n_2024_secure" -ForegroundColor Yellow
Write-Host "4. Import workflows from ../n8n-workflows/" -ForegroundColor Yellow
Write-Host ""
Write-Host "🛑 To stop n8n: Run .\stop-n8n.bat" -ForegroundColor Red 