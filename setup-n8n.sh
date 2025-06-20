#!/bin/bash

# CUBS Employee Management System - n8n Setup Script
# This script sets up n8n for workflow automation

echo "🚀 Setting up n8n for CUBS Employee Management System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Docker and Docker Compose are installed ✓"
}

# Generate encryption key
generate_encryption_key() {
    if command -v openssl &> /dev/null; then
        ENCRYPTION_KEY=$(openssl rand -hex 16)
        print_status "Generated encryption key: $ENCRYPTION_KEY"
    else
        print_warning "OpenSSL not found. Please manually generate a 32-character encryption key."
        ENCRYPTION_KEY="please_replace_with_32_char_key"
    fi
}

# Create environment file
create_env_file() {
    print_header "Creating environment configuration..."
    
    if [ -f ".env.n8n" ]; then
        print_warning ".env.n8n already exists. Creating backup..."
        cp .env.n8n .env.n8n.backup
    fi
    
    cat > .env.n8n << EOF
# n8n Configuration - Generated $(date)
N8N_USER=admin
N8N_PASSWORD=cubs_n8n_2024_secure
N8N_ENCRYPTION_KEY=${ENCRYPTION_KEY}
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
EOF
    
    print_status "Environment file created: .env.n8n"
    print_warning "⚠️  IMPORTANT: Edit .env.n8n and replace placeholder values with your actual credentials!"
}

# Create directories
create_directories() {
    print_header "Creating necessary directories..."
    
    mkdir -p ~/.n8n
    mkdir -p ./n8n-workflows
    mkdir -p ./n8n-backups
    
    print_status "Directories created ✓"
}

# Start n8n services
start_n8n() {
    print_header "Starting n8n services..."
    
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found! Please ensure it exists in the current directory."
        exit 1
    fi
    
    # Pull latest images
    print_status "Pulling Docker images..."
    docker-compose --env-file .env.n8n pull
    
    # Start services in detached mode
    print_status "Starting services..."
    docker-compose --env-file .env.n8n up -d
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 10
    
    # Check if services are running
    if docker-compose --env-file .env.n8n ps | grep -q "Up"; then
        print_status "n8n services started successfully! ✓"
        echo ""
        print_header "🎉 n8n is now running!"
        echo -e "   Access URL: ${GREEN}http://localhost:5678${NC}"
        echo -e "   Username: ${YELLOW}admin${NC}"
        echo -e "   Password: ${YELLOW}cubs_n8n_2024_secure${NC}"
        echo ""
        print_warning "Remember to:"
        echo "   1. Edit .env.n8n with your actual credentials"
        echo "   2. Import the visa reminder workflow from n8n-workflows/"
        echo "   3. Set up your Supabase and SendGrid credentials in n8n"
    else
        print_error "Failed to start n8n services. Check the logs:"
        docker-compose --env-file .env.n8n logs
    fi
}

# Create backup script
create_backup_script() {
    print_header "Creating backup script..."
    
    cat > backup-n8n.sh << 'EOF'
#!/bin/bash
# n8n Backup Script for CUBS Employee Management System

BACKUP_DIR="./n8n-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/n8n_backup_$TIMESTAMP.tar.gz"

echo "Creating n8n backup..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Stop n8n temporarily
docker-compose --env-file .env.n8n stop n8n

# Create backup
tar -czf $BACKUP_FILE ~/.n8n

# Start n8n again
docker-compose --env-file .env.n8n start n8n

echo "Backup created: $BACKUP_FILE"

# Keep only last 5 backups
cd $BACKUP_DIR
ls -t n8n_backup_*.tar.gz | tail -n +6 | xargs -r rm

echo "Backup completed successfully!"
EOF
    
    chmod +x backup-n8n.sh
    print_status "Backup script created: backup-n8n.sh ✓"
}

# Create workflow import script
create_import_script() {
    print_header "Creating workflow import helper..."
    
    cat > import-workflows.sh << 'EOF'
#!/bin/bash
# Import CUBS workflows into n8n

echo "📋 CUBS Workflow Import Helper"
echo ""
echo "To import workflows:"
echo "1. Access n8n at http://localhost:5678"
echo "2. Go to Workflows section"
echo "3. Click 'Import from file'"
echo "4. Select workflow files from n8n-workflows/ directory"
echo ""
echo "Available workflows:"
for file in n8n-workflows/*.json; do
    if [ -f "$file" ]; then
        echo "  - $(basename "$file")"
    fi
done
echo ""
echo "After importing:"
echo "1. Set up your credentials (Supabase, SendGrid, etc.)"
echo "2. Test each workflow individually"
echo "3. Activate the workflows you want to run"
EOF
    
    chmod +x import-workflows.sh
    print_status "Import helper created: import-workflows.sh ✓"
}

# Main execution
main() {
    print_header "======================================"
    print_header "CUBS Employee Management - n8n Setup"
    print_header "======================================"
    echo ""
    
    check_docker
    generate_encryption_key
    create_directories
    create_env_file
    create_backup_script
    create_import_script
    
    echo ""
    print_header "Ready to start n8n? (y/n)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        start_n8n
    else
        print_status "Setup completed. Run the following when ready:"
        print_status "docker-compose --env-file .env.n8n up -d"
    fi
    
    echo ""
    print_header "📚 Next Steps:"
    echo "1. Edit .env.n8n with your actual credentials"
    echo "2. Access n8n at http://localhost:5678"
    echo "3. Run ./import-workflows.sh for workflow import instructions"
    echo "4. Set up credentials in n8n Settings"
    echo "5. Test and activate your workflows"
    echo ""
    print_status "Setup completed! 🎉"
}

# Run main function
main "$@" 