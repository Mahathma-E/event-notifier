# GCE Smart Notify - Database Setup Helper Script
# This script helps you set up the PostgreSQL database

Write-Host "GCE Smart Notify - Database Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is installed
$pgPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $pgPath) {
    Write-Host "PostgreSQL psql command not found in PATH." -ForegroundColor Yellow
    Write-Host "Please ensure PostgreSQL is installed and psql is in your PATH." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common PostgreSQL installation paths:" -ForegroundColor Yellow
    Write-Host "  - C:\Program Files\PostgreSQL\<version>\bin\psql.exe" -ForegroundColor Gray
    Write-Host ""
    Write-Host "You can either:" -ForegroundColor Yellow
    Write-Host "  1. Add PostgreSQL bin directory to your PATH" -ForegroundColor Gray
    Write-Host "  2. Use pgAdmin to create the database manually" -ForegroundColor Gray
    Write-Host "  3. Run the SQL script (setup-database.sql) in your PostgreSQL client" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "PostgreSQL found at: $($pgPath.Source)" -ForegroundColor Green
Write-Host ""

# Prompt for database connection details
$dbUser = Read-Host "Enter PostgreSQL username (default: postgres)"
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    $dbUser = "postgres"
}

$dbPassword = Read-Host "Enter PostgreSQL password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

Write-Host ""
Write-Host "Creating database 'gce_smart_notify'..." -ForegroundColor Cyan

# Set PGPASSWORD environment variable for this session
$env:PGPASSWORD = $dbPasswordPlain

# Create database
$createDbCommand = "CREATE DATABASE gce_smart_notify;"
$result = echo $createDbCommand | & psql -U $dbUser -h localhost -p 5432 -d postgres 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The application will automatically create all tables on first run." -ForegroundColor Green
    Write-Host "You can now start the application with: npm run dev" -ForegroundColor Green
} else {
    if ($result -match "already exists") {
        Write-Host "Database already exists. That's okay!" -ForegroundColor Yellow
        Write-Host "You can now start the application with: npm run dev" -ForegroundColor Green
    } else {
        Write-Host "Error creating database:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        Write-Host ""
        Write-Host "Please check:" -ForegroundColor Yellow
        Write-Host "  1. PostgreSQL service is running" -ForegroundColor Gray
        Write-Host "  2. Username and password are correct" -ForegroundColor Gray
        Write-Host "  3. You have permission to create databases" -ForegroundColor Gray
    }
}

# Clear password from environment
Remove-Item Env:\PGPASSWORD
