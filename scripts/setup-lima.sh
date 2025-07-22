#!/bin/bash
# KernelQ Lima VM Setup - Host Automation Script
# This script sets up Lima VM with openSUSE Leap and SQLite for KernelQ

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
LIMA_INSTANCE="kernelq-dev"
LIMA_TEMPLATE="opensuse-leap"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

# Check if Lima is installed
check_lima() {
    log_info "Checking Lima installation..."
    
    if ! command -v limactl &> /dev/null; then
        log_error "Lima is not installed!"
        log_info "Install Lima with: curl -sSf https://get.lima.sh | sh"
        log_info "Or visit: https://lima-vm.io/docs/installation/"
        exit 1
    fi
    
    local lima_version=$(limactl --version 2>&1 | head -n1 | cut -d' ' -f3)
    log_success "Lima installed: v$lima_version"
}

# Check if Node.js is available on host
check_nodejs() {
    log_info "Checking Node.js on host..."
    
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        log_success "Node.js available: $node_version"
    else
        log_warning "Node.js not found on host. Frontend will need to be run from Lima VM."
    fi
}

# Check existing Lima instance
check_existing_instance() {
    log_info "Checking for existing Lima instance..."
    
    if limactl list | grep -q "^$LIMA_INSTANCE"; then
        local status=$(limactl list | grep "^$LIMA_INSTANCE" | awk '{print $2}')
        log_warning "Lima instance '$LIMA_INSTANCE' already exists (status: $status)"
        
        read -p "Do you want to delete and recreate it? [y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Stopping and deleting existing instance..."
            limactl stop "$LIMA_INSTANCE" 2>/dev/null || true
            limactl delete "$LIMA_INSTANCE" 2>/dev/null || true
            log_success "Existing instance removed"
        else
            log_info "Using existing instance"
            return 1
        fi
    fi
    return 0
}

# Create Lima VM
create_lima_vm() {
    log_step "Creating Lima VM with openSUSE Leap..."
    
    log_info "Starting Lima instance: $LIMA_INSTANCE"
    log_info "Template: $LIMA_TEMPLATE"
    log_info "This may take several minutes for first-time setup..."
    
    # Start Lima VM
    if ! limactl start "template://$LIMA_TEMPLATE" --name "$LIMA_INSTANCE"; then
        log_error "Failed to create Lima VM"
        exit 1
    fi
    
    log_success "Lima VM created and started"
    
    # Wait for VM to be ready
    log_info "Waiting for VM to be fully ready..."
    sleep 10
    
    # Verify VM is running
    local status=$(limactl list | grep "^$LIMA_INSTANCE" | awk '{print $2}')
    if [[ "$status" != "Running" ]]; then
        log_error "VM is not running (status: $status)"
        exit 1
    fi
    
    log_success "VM is running and ready"
}

# Install dependencies in Lima VM
install_dependencies() {
    log_step "Installing dependencies in Lima VM..."
    
    log_info "Updating package manager..."
    limactl shell "$LIMA_INSTANCE" sudo zypper refresh
    
    log_info "Installing SQLite and Node.js..."
    limactl shell "$LIMA_INSTANCE" sudo zypper install -y sqlite3 sqlite3-devel nodejs npm
    
    log_info "Verifying installations..."
    local sqlite_version=$(limactl shell "$LIMA_INSTANCE" sqlite3 --version | cut -d' ' -f1)
    local node_version=$(limactl shell "$LIMA_INSTANCE" node --version)
    local npm_version=$(limactl shell "$LIMA_INSTANCE" npm --version)
    
    log_success "Dependencies installed:"
    log_success "  SQLite: $sqlite_version"
    log_success "  Node.js: $node_version"
    log_success "  NPM: $npm_version"
}

# Install backend dependencies
install_backend_deps() {
    log_step "Installing backend dependencies..."
    
    log_info "Installing better-sqlite3 and bcrypt..."
    cd "$PROJECT_ROOT/backend"
    npm install better-sqlite3 bcrypt
    
    log_success "Backend dependencies installed"
}

# Setup database in Lima VM
setup_database() {
    log_step "Setting up database in Lima VM..."
    
    # Make setup script executable
    chmod +x "$SCRIPT_DIR/lima-db-setup.sh"
    
    # Copy and run setup script in Lima VM
    log_info "Running database setup script in Lima VM..."
    if ! limactl shell "$LIMA_INSTANCE" bash -s < "$SCRIPT_DIR/lima-db-setup.sh"; then
        log_error "Database setup failed"
        exit 1
    fi
    
    log_success "Database setup completed"
}

# Verify setup
verify_setup() {
    log_step "Verifying complete setup..."
    
    # Check VM status
    local vm_status=$(limactl list | grep "^$LIMA_INSTANCE" | awk '{print $2}')
    log_info "VM status: $vm_status"
    
    # Check database
    log_info "Testing database connection..."
    local table_count=$(limactl shell "$LIMA_INSTANCE" sqlite3 ~/kernelq-data/db/kernelq.db "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")
    log_info "Database tables: $table_count"
    
    # Check backend
    log_info "Testing backend dependencies..."
    if limactl shell "$LIMA_INSTANCE" -- sh -c "cd ~/WebstormProjects/KernelOne-main/backend && node -e \"require('better-sqlite3'); console.log('✅ better-sqlite3 OK')\""; then
        log_success "Backend dependencies verified"
    else
        log_warning "Backend dependency check failed"
    fi
    
    log_success "Setup verification completed"
}

# Create development scripts
create_dev_scripts() {
    log_step "Creating development scripts..."
    
    # Create start-dev.sh
    cat > "$SCRIPT_DIR/start-dev.sh" << 'EOF'
#!/bin/bash
# KernelQ Development Starter Script

set -euo pipefail

LIMA_INSTANCE="kernelq-dev"
PROJECT_ROOT="$(dirname "$(dirname "$(realpath "$0")")")"

echo "🚀 Starting KernelQ Development Environment"
echo "=========================================="

# Check if Lima VM is running
if ! limactl list | grep -q "^$LIMA_INSTANCE.*Running"; then
    echo "📦 Starting Lima VM..."
    limactl start "$LIMA_INSTANCE"
    sleep 5
fi

echo "✅ Lima VM is running"

# Function to run backend
start_backend() {
    echo "🔧 Starting backend server in Lima VM..."
    limactl shell "$LIMA_INSTANCE" -- sh -c "
        cd ~/WebstormProjects/KernelOne-main/backend
        echo '🔥 KernelQ Backend Server Starting...'
        echo '📍 Database: ~/kernelq-data/db/kernelq.db'
        echo '🌐 Server: http://localhost:3001'
        echo '📊 API Docs: http://localhost:3001/api/health'
        echo ''
        npm start
    "
}

# Function to run frontend
start_frontend() {
    echo "⚛️  Starting frontend server..."
    cd "$PROJECT_ROOT/src"
    echo "🌐 Frontend: http://localhost:3000"
    echo ""
    npm start
}

# Check if frontend deps are installed
if [[ ! -d "$PROJECT_ROOT/src/node_modules" ]]; then
    echo "📦 Installing frontend dependencies..."
    cd "$PROJECT_ROOT/src"
    npm install
fi

# Start based on argument
case "${1:-both}" in
    "backend"|"back"|"b")
        start_backend
        ;;
    "frontend"|"front"|"f")
        start_frontend
        ;;
    "both"|"all"|*)
        echo "🎯 Choose startup mode:"
        echo "1) Backend only (Lima VM)"
        echo "2) Frontend only (Host)"
        echo "3) Backend first, then frontend"
        read -p "Select [1-3]: " choice
        
        case $choice in
            1) start_backend ;;
            2) start_frontend ;;
            3) 
                echo "🔧 Starting backend in background..."
                limactl shell "$LIMA_INSTANCE" -- sh -c "cd ~/WebstormProjects/KernelOne-main/backend && npm start" &
                sleep 3
                echo "⚛️  Starting frontend..."
                start_frontend
                ;;
            *) 
                echo "❌ Invalid choice"
                exit 1
                ;;
        esac
        ;;
esac
EOF
    
    chmod +x "$SCRIPT_DIR/start-dev.sh"
    
    # Create backup script
    cat > "$SCRIPT_DIR/backup-db.sh" << 'EOF'
#!/bin/bash
# KernelQ Database Backup Script (Host)

LIMA_INSTANCE="kernelq-dev"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🔄 Creating KernelQ database backup..."

# Create local backup directory
mkdir -p "$BACKUP_DIR"

# Create backup in Lima VM
limactl shell "$LIMA_INSTANCE" ~/kernelq-backup.sh

# Copy backup to host
echo "📥 Copying backup to host..."
limactl shell "$LIMA_INSTANCE" -- sh -c "ls -t ~/kernelq-data/backups/kernelq_*.db | head -1" | xargs -I {} limactl shell "$LIMA_INSTANCE" cat {} > "$BACKUP_DIR/kernelq_$TIMESTAMP.db"

echo "✅ Backup saved to: $BACKUP_DIR/kernelq_$TIMESTAMP.db"
echo "📊 Backup size: $(du -h "$BACKUP_DIR/kernelq_$TIMESTAMP.db" | cut -f1)"
EOF
    
    chmod +x "$SCRIPT_DIR/backup-db.sh"
    
    log_success "Development scripts created:"
    log_success "  $SCRIPT_DIR/start-dev.sh - Start development environment"
    log_success "  $SCRIPT_DIR/backup-db.sh - Backup database to host"
}

# Display usage information
show_usage() {
    log_step "KernelQ Lima Setup Complete! 🎉"
    echo ""
    log_info "Development Commands:"
    log_info "  ./scripts/start-dev.sh          - Start development environment"
    log_info "  ./scripts/backup-db.sh          - Backup database"
    log_info "  limactl shell $LIMA_INSTANCE    - Access Lima VM shell"
    echo ""
    log_info "Lima VM Commands:"
    log_info "  limactl start $LIMA_INSTANCE    - Start VM"
    log_info "  limactl stop $LIMA_INSTANCE     - Stop VM"
    log_info "  limactl delete $LIMA_INSTANCE   - Delete VM"
    echo ""
    log_info "Database Commands (in Lima VM):"
    log_info "  kernelq-db                      - SQLite shell"
    log_info "  kernelq-backup                  - Create backup"
    log_info "  kernelq-users                   - Show users"
    echo ""
    log_info "URLs:"
    log_info "  Backend API: http://localhost:3001"
    log_info "  Frontend:    http://localhost:3000"
    log_info "  Health:      http://localhost:3001/api/health"
    echo ""
    log_success "Ready to start kernel hacking! 🐧"
}

# Main function
main() {
    echo "🚀 KernelQ Lima Setup"
    echo "===================="
    echo ""
    
    check_lima
    check_nodejs
    
    # Only create new VM if needed
    if check_existing_instance; then
        create_lima_vm
        install_dependencies
    else
        log_info "Using existing Lima VM"
    fi
    
    install_backend_deps
    setup_database
    verify_setup
    create_dev_scripts
    show_usage
}

# Error handler
error_handler() {
    log_error "Setup failed at line $1"
    log_info "Check the logs above for details"
    log_info "You can retry with: $0"
    exit 1
}

trap 'error_handler $LINENO' ERR

# Run main function
main "$@"