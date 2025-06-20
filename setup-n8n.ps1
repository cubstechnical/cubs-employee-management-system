# CUBS Employee Management System - n8n Setup Script (Windows PowerShell)
# This script sets up n8n for workflow automation

Write-Host "🚀 Setting up n8n for CUBS Employee Management System..." -ForegroundColor Green

# Function to print colored output
function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Header {
    param($Message)
    Write-Host $Message -ForegroundColor Cyan
}

# Check if Docker is installed
function Test-Docker {
    if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed. Please install Docker Desktop first."
        exit 1
    }
    
    if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Error "Docker Compose is not installed. Please install Docker Desktop first."
        exit 1
    }
    
    Write-Status "Docker and Docker Compose are installed ✓"
}

# Generate encryption key
function New-EncryptionKey {
    # Generate a random 32-character hex string
    $bytes = New-Object byte[] 16
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
    $rng.GetBytes($bytes)
    $encryptionKey = [System.BitConverter]::ToString($bytes).Replace('-', '').ToLower()
    Write-Status "Generated encryption key: $encryptionKey"
    return $encryptionKey
}

# Create environment file
function New-EnvFile {
    param($EncryptionKey)
    
    Write-Header "Creating environment configuration..."
    
    if (Test-Path ".env.n8n") {
        Write-Warning ".env.n8n already exists. Creating backup..."
        Copy-Item ".env.n8n" ".env.n8n.backup"
    }
    
    $envContent = @"
# n8n Configuration - Generated $(Get-Date)
N8N_USER=admin
N8N_PASSWORD=cubs_n8n_2024_secure
N8N_ENCRYPTION_KEY=$EncryptionKey
N8N_DB_USER=n8n_user
N8N_DB_PASSWORD=n8n_secure_password_2024

# Supabase Configuration (replace with your actual values)
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=your_supabase_user
SUPABASE_DB_PASSWORD=your_supabase_password

# Service API Keys (replace with your actual values)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
SENDGRID_API_KEY=your_sendgrid_api_key
BACKBLAZE_APPLICATION_KEY_ID=your_backblaze_key_id
BACKBLAZE_APPLICATION_KEY=your_backblaze_key

# OpenAI for AI workflows (optional)
OPENAI_API_KEY=your_openai_api_key
"@
    
    $envContent | Out-File -FilePath ".env.n8n" -Encoding UTF8
    Write-Status "Environment file created: .env.n8n"
    Write-Warning "⚠️  IMPORTANT: Edit .env.n8n and replace placeholder values with your actual credentials!"
}

# Create directories
function New-Directories {
    Write-Header "Creating necessary directories..."
    
    $homeDir = $env:USERPROFILE
    New-Item -ItemType Directory -Force -Path "$homeDir\.n8n" | Out-Null
    New-Item -ItemType Directory -Force -Path ".\n8n-workflows" | Out-Null
    New-Item -ItemType Directory -Force -Path ".\n8n-backups" | Out-Null
    
    Write-Status "Directories created ✓"
}

# Start n8n services
function Start-N8n {
    Write-Header "Starting n8n services..."
    
    if (!(Test-Path "docker-compose.yml")) {
        Write-Error "docker-compose.yml not found! Please ensure it exists in the current directory."
        exit 1
    }
    
    # Pull latest images
    Write-Status "Pulling Docker images..."
    docker-compose --env-file .env.n8n pull
    
    # Start services in detached mode
    Write-Status "Starting services..."
    docker-compose --env-file .env.n8n up -d
    
    # Wait for services to start
    Write-Status "Waiting for services to start..."
    Start-Sleep -Seconds 10
    
    # Check if services are running
    $services = docker-compose --env-file .env.n8n ps
    if ($services -match "Up") {
        Write-Status "n8n services started successfully! ✓"
        Write-Host ""
        Write-Header "🎉 n8n is now running!"
        Write-Host "   Access URL: " -NoNewline
        Write-Host "http://localhost:5678" -ForegroundColor Green
        Write-Host "   Username: " -NoNewline
        Write-Host "admin" -ForegroundColor Yellow
        Write-Host "   Password: " -NoNewline
        Write-Host "cubs_n8n_2024_secure" -ForegroundColor Yellow
        Write-Host ""
        Write-Warning "Remember to:"
        Write-Host "   1. Edit .env.n8n with your actual credentials"
        Write-Host "   2. Import the visa reminder workflow from n8n-workflows/"
        Write-Host "   3. Set up your Supabase and SendGrid credentials in n8n"
    } else {
        Write-Error "Failed to start n8n services. Check the logs:"
        docker-compose --env-file .env.n8n logs
    }
}

# Create backup script
function New-BackupScript {
    Write-Header "Creating backup script..."
    
    $backupScript = @'
# n8n Backup Script for CUBS Employee Management System (PowerShell)

$BackupDir = ".\n8n-backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupDir\n8n_backup_$Timestamp.zip"

Write-Host "Creating n8n backup..."

# Create backup directory if it doesn't exist
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

# Stop n8n temporarily
docker-compose --env-file .env.n8n stop n8n

# Create backup
$homeDir = $env:USERPROFILE
Compress-Archive -Path "$homeDir\.n8n" -DestinationPath $BackupFile -Force

# Start n8n again
docker-compose --env-file .env.n8n start n8n

Write-Host "Backup created: $BackupFile"

# Keep only last 5 backups
$backupFiles = Get-ChildItem -Path $BackupDir -Filter "n8n_backup_*.zip" | Sort-Object LastWriteTime -Descending
if ($backupFiles.Count -gt 5) {
    $backupFiles | Select-Object -Skip 5 | Remove-Item -Force
}

Write-Host "Backup completed successfully!"
'@
    
    $backupScript | Out-File -FilePath "backup-n8n.ps1" -Encoding UTF8
    Write-Status "Backup script created: backup-n8n.ps1 ✓"
}

# Create workflow import script
function New-ImportScript {
    Write-Header "Creating workflow import helper..."
    
    $importScript = @'
# Import CUBS workflows into n8n (PowerShell)

Write-Host "📋 CUBS Workflow Import Helper"
Write-Host ""
Write-Host "To import workflows:"
Write-Host "1. Access n8n at http://localhost:5678"
Write-Host "2. Go to Workflows section"
Write-Host "3. Click 'Import from file'"
Write-Host "4. Select workflow files from n8n-workflows/ directory"
Write-Host ""
Write-Host "Available workflows:"

$workflowFiles = Get-ChildItem -Path "n8n-workflows" -Filter "*.json" -ErrorAction SilentlyContinue
if ($workflowFiles) {
    foreach ($file in $workflowFiles) {
        Write-Host "  - $($file.Name)"
    }
} else {
    Write-Host "  No workflow files found in n8n-workflows/"
}

Write-Host ""
Write-Host "After importing:"
Write-Host "1. Set up your credentials (Supabase, SendGrid, etc.)"
Write-Host "2. Test each workflow individually"
Write-Host "3. Activate the workflows you want to run"
'@
    
    $importScript | Out-File -FilePath "import-workflows.ps1" -Encoding UTF8
    Write-Status "Import helper created: import-workflows.ps1 ✓"
}

# Main execution
function Main {
    Write-Header "======================================"
    Write-Header "CUBS Employee Management - n8n Setup"
    Write-Header "======================================"
    Write-Host ""
    
    Test-Docker
    $encryptionKey = New-EncryptionKey
    New-Directories
    New-EnvFile -EncryptionKey $encryptionKey
    New-BackupScript
    New-ImportScript
    
    Write-Host ""
    Write-Header "Ready to start n8n? (y/n)"
    $response = Read-Host
    
    if ($response -match "^[Yy]$") {
        Start-N8n
    } else {
        Write-Status "Setup completed. Run the following when ready:"
        Write-Status "docker-compose --env-file .env.n8n up -d"
    }
    
    Write-Host ""
    Write-Header "📚 Next Steps:"
    Write-Host "1. Edit .env.n8n with your actual credentials"
    Write-Host "2. Access n8n at http://localhost:5678"
    Write-Host "3. Run .\import-workflows.ps1 for workflow import instructions"
    Write-Host "4. Set up credentials in n8n Settings"
    Write-Host "5. Test and activate your workflows"
    Write-Host ""
    Write-Status "Setup completed! 🎉"
}

# Run main function
Main 