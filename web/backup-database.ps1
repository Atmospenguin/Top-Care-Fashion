# Database Backup Script for Supabase
# Date: 2025-01-27
# Description: Backup database before RLS migration

# Load environment variables from .env file
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $scriptDir ".env"

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line.Split("=", 2)
            if ($parts.Length -eq 2) {
                $key = $parts[0].Trim()
                $value = $parts[1].Trim()
                # Remove quotes if present
                if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                    $value = $value.Substring(1, $value.Length - 2)
                } elseif ($value.StartsWith("'") -and $value.EndsWith("'")) {
                    $value = $value.Substring(1, $value.Length - 2)
                }
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
    Write-Host "✅ Loaded environment variables from .env" -ForegroundColor Green
} else {
    Write-Host "❌ Error: .env file not found at $envFile" -ForegroundColor Red
    exit 1
}

# Get database connection details
$directUrl = $env:DIRECT_URL
if (-not $directUrl) {
    Write-Host "❌ Error: DIRECT_URL not found in .env file" -ForegroundColor Red
    exit 1
}

# Parse connection string
# Format: postgresql://user:password@host:port/database
if ($directUrl -match 'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)') {
    $dbUser = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
    
    Write-Host "Database: $dbName" -ForegroundColor Green
    Write-Host "Host: $dbHost" -ForegroundColor Green
    Write-Host "Port: $dbPort" -ForegroundColor Green
    Write-Host "User: $dbUser" -ForegroundColor Green
} else {
    Write-Host "❌ Error: Invalid DIRECT_URL format" -ForegroundColor Red
    exit 1
}

# Create backup directory
$backupDir = Join-Path $scriptDir "backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "✅ Created backup directory: $backupDir" -ForegroundColor Green
} else {
    Write-Host "✅ Backup directory exists: $backupDir" -ForegroundColor Green
}

# Generate backup filename with timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $backupDir "backup_$timestamp.sql"
$backupFileCompressed = "$backupFile.gz"

Write-Host ""
Write-Host "Starting database backup..." -ForegroundColor Yellow
Write-Host "Backup file: $backupFileCompressed" -ForegroundColor Cyan

# Check if pg_dump is available
$pgDumpPath = Get-Command pg_dump -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if (-not $pgDumpPath) {
    Write-Host "❌ Error: pg_dump not found. Please install PostgreSQL client tools." -ForegroundColor Red
    Write-Host "You can download it from: https://www.postgresql.org/download/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternatively, you can use Supabase CLI:" -ForegroundColor Yellow
    Write-Host "  supabase db dump --project-id ilykxrtilsbymlncunua > $backupFile" -ForegroundColor Cyan
    exit 1
}

Write-Host "Using pg_dump: $pgDumpPath" -ForegroundColor Green

# Set PGPASSWORD environment variable for pg_dump
$env:PGPASSWORD = $dbPassword

# Build pg_dump command
$pgDumpArgs = @(
    "-h", $dbHost
    "-p", $dbPort
    "-U", $dbUser
    "-d", $dbName
    "-F", "c"
    "-f", $backupFileCompressed
    "--verbose"
    "--no-owner"
    "--no-privileges"
)

# Execute pg_dump
try {
    Write-Host ""
    Write-Host "Executing pg_dump..." -ForegroundColor Yellow
    & $pgDumpPath $pgDumpArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Database backup completed successfully!" -ForegroundColor Green
        Write-Host "Backup file: $backupFileCompressed" -ForegroundColor Cyan
        
        # Get file size
        $fileSize = (Get-Item $backupFileCompressed).Length
        $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
        Write-Host "File size: $fileSizeMB MB" -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "To restore this backup, use:" -ForegroundColor Yellow
        $restoreCommand = "pg_restore -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $backupFileCompressed"
        Write-Host "  $restoreCommand" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ Backup failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error during backup: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clear password from environment
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

$completionTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host ""
Write-Host "Backup completed at: $completionTime" -ForegroundColor Green
