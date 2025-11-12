#!/bin/bash
# Database Backup Script for Supabase
# Date: 2025-01-27
# Description: Backup database before RLS migration

set -e

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

# Get database connection details
DIRECT_URL="${DIRECT_URL:-}"

if [ -z "$DIRECT_URL" ]; then
    echo "Error: DIRECT_URL not found in .env file"
    exit 1
fi

# Parse connection string
# Format: postgresql://user:password@host:port/database
DB_USER=$(echo $DIRECT_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASSWORD=$(echo $DIRECT_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DIRECT_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DIRECT_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DIRECT_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "Database: $DB_NAME"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "User: $DB_USER"

# Create backup directory
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"
BACKUP_FILE_COMPRESSED="$BACKUP_FILE.gz"

echo ""
echo "Starting database backup..."
echo "Backup file: $BACKUP_FILE_COMPRESSED"

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo "Error: pg_dump not found. Please install PostgreSQL client tools."
    echo "You can install it with:"
    echo "  - macOS: brew install postgresql"
    echo "  - Ubuntu: sudo apt-get install postgresql-client"
    echo "  - Windows: Download from https://www.postgresql.org/download/"
    echo ""
    echo "Alternatively, you can use Supabase CLI:"
    echo "  supabase db dump --project-id ilykxrtilsbymlncunua > $BACKUP_FILE"
    exit 1
fi

# Set PGPASSWORD environment variable for pg_dump
export PGPASSWORD="$DB_PASSWORD"

# Execute pg_dump
echo ""
echo "Executing pg_dump..."
pg_dump -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -F c \
        -f "$BACKUP_FILE_COMPRESSED" \
        --verbose \
        --no-owner \
        --no-privileges

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database backup completed successfully!"
    echo "Backup file: $BACKUP_FILE_COMPRESSED"
    
    # Get file size
    FILE_SIZE=$(du -h "$BACKUP_FILE_COMPRESSED" | cut -f1)
    echo "File size: $FILE_SIZE"
    
    echo ""
    echo "To restore this backup, use:"
    echo "  pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $BACKUP_FILE_COMPRESSED"
else
    echo ""
    echo "❌ Backup failed"
    exit 1
fi

echo ""
echo "Backup completed at: $(date '+%Y-%m-%d %H:%M:%S')"

# Clear password from environment
unset PGPASSWORD

