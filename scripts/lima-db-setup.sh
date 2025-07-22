#!/bin/bash
# KernelQ Lima Complete Setup Script
# Prerequisites: Only limactl installed
# This script will: create Lima VM, install dependencies, setup database

set -euo pipefail

echo "🚀 KernelQ Lima Complete Setup"
echo "==============================="

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
DB_DIR="/home/zerohexer.linux/kernelq-data/db"
BACKUP_DIR="/home/zerohexer.linux/kernelq-data/backups"
DB_PATH="$DB_DIR/kernelq.db"
PROJECT_DIR="/home/zerohexer/WebstormProjects/KernelOne-main"

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
    log_step "Checking Lima installation..."
    
    if ! command -v limactl &> /dev/null; then
        log_error "Lima is not installed!"
        log_info "Install Lima with: curl -sSf https://get.lima.sh | sh"
        log_info "Or visit: https://lima-vm.io/docs/installation/"
        exit 1
    fi
    
    local lima_version=$(limactl --version 2>&1 | head -n1 | cut -d' ' -f3)
    log_success "Lima installed: v$lima_version"
}

# Check for existing Lima instance
check_existing_instance() {
    log_step "Checking for existing Lima instance..."
    
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
            return 0
        else
            log_info "Using existing instance"
            return 1
        fi
    fi
    return 0
}

# Create Lima VM with openSUSE Leap
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

# Create directory structure in Lima VM
setup_directories() {
    log_step "Setting up directory structure in Lima VM..."
    
    limactl shell "$LIMA_INSTANCE" -- mkdir -p "$DB_DIR" "$BACKUP_DIR"
    
    log_success "Created directories in Lima VM:"
    log_success "  Database: $DB_DIR"
    log_success "  Backups:  $BACKUP_DIR"
    
    # Verify directories
    limactl shell "$LIMA_INSTANCE" -- ls -la "$DB_DIR" "$BACKUP_DIR"
}

# Install backend dependencies (better-sqlite3)
install_backend_deps() {
    log_step "Installing backend dependencies..."
    
    # Check if project directory exists
    if ! limactl shell "$LIMA_INSTANCE" -- test -d "$PROJECT_DIR/backend"; then
        log_error "Backend directory not found: $PROJECT_DIR/backend"
        log_error "Make sure the project is properly mounted in Lima VM"
        exit 1
    fi
    
    log_info "Installing better-sqlite3 and bcrypt..."
    limactl shell "$LIMA_INSTANCE" -- sh -c "cd $PROJECT_DIR/backend && npm install better-sqlite3 bcrypt"
    
    log_success "Backend dependencies installed"
}

# Initialize database in Lima VM
initialize_database() {
    log_step "Initializing KernelQ database in Lima VM..."
    
    # Initialize database with explicit path
    limactl shell "$LIMA_INSTANCE" -- sh -c "
        cd $PROJECT_DIR/backend
        KERNELQ_DB_PATH='$DB_PATH' node -e \"
            const { KernelQDatabase } = require('./database');
            const db = new KernelQDatabase('$DB_PATH');
            console.log('🔧 Initializing database at: $DB_PATH');
            db.initialize().then(() => {
                console.log('✅ Database initialized successfully');
                
                // Verify schema
                const tables = db.db.prepare(\\\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\\\").all();
                console.log('📊 Created tables:', tables.map(t => t.name).join(', '));
                
                // Check WAL mode
                const walMode = db.db.prepare('PRAGMA journal_mode').get();
                console.log('📝 Journal mode:', walMode.journal_mode);
                
                db.close();
                console.log('🎯 Database ready for KernelQ!');
            }).catch(error => {
                console.error('❌ Database initialization failed:', error);
                process.exit(1);
            });
        \"
    "
    
    log_success "Database initialized at: $DB_PATH"
}

# Verify database setup
verify_database() {
    log_step "Verifying database setup..."
    
    # Check file exists and has content
    if ! limactl shell "$LIMA_INSTANCE" -- test -f "$DB_PATH"; then
        log_error "Database file not found: $DB_PATH"
        exit 1
    fi
    
    local db_size=$(limactl shell "$LIMA_INSTANCE" -- du -h "$DB_PATH" | cut -f1)
    log_info "Database size: $db_size"
    
    # Check tables exist
    local table_count=$(limactl shell "$LIMA_INSTANCE" -- sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")
    if [[ "$table_count" -lt 3 ]]; then
        log_error "Expected at least 3 tables, found: $table_count"
        exit 1
    fi
    
    # Check integrity
    local integrity=$(limactl shell "$LIMA_INSTANCE" -- sqlite3 "$DB_PATH" "PRAGMA integrity_check;")
    if [[ "$integrity" != "ok" ]]; then
        log_error "Database integrity check failed: $integrity"
        exit 1
    fi
    
    # Check WAL mode
    local journal_mode=$(limactl shell "$LIMA_INSTANCE" -- sqlite3 "$DB_PATH" "PRAGMA journal_mode;")
    if [[ "$journal_mode" != "wal" ]]; then
        log_warning "Expected WAL mode, found: $journal_mode"
    fi
    
    log_success "Database verification passed"
    log_success "  Tables: $table_count"
    log_success "  Integrity: $integrity"
    log_success "  Journal mode: $journal_mode"
}

# Create backup script in Lima VM
create_backup_script() {
    log_step "Creating backup script in Lima VM..."
    
    limactl shell "$LIMA_INSTANCE" -- cat > /home/zerohexer/kernelq-backup.sh << EOF
#!/bin/bash
# KernelQ Database Backup Script

set -euo pipefail

DB_PATH="$DB_PATH"
BACKUP_DIR="$BACKUP_DIR"
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="\$BACKUP_DIR/kernelq_\$TIMESTAMP.db"

echo "🔄 Creating database backup..."
echo "Source: \$DB_PATH"
echo "Target: \$BACKUP_PATH"

# Create backup
sqlite3 "\$DB_PATH" ".backup '\$BACKUP_PATH'"

# Verify backup
if sqlite3 "\$BACKUP_PATH" "PRAGMA integrity_check;" | grep -q "ok"; then
    echo "✅ Backup created successfully: \$BACKUP_PATH"
    echo "📊 Backup size: \$(du -h "\$BACKUP_PATH" | cut -f1)"
    
    # Clean old backups (keep last 10)
    cd "\$BACKUP_DIR"
    ls -t kernelq_*.db 2>/dev/null | tail -n +11 | xargs rm -f
    echo "🧹 Cleaned old backups (keeping last 10)"
else
    echo "❌ Backup verification failed"
    rm -f "\$BACKUP_PATH"
    exit 1
fi
EOF
    
    limactl shell "$LIMA_INSTANCE" -- chmod +x /home/zerohexer/kernelq-backup.sh
    log_success "Backup script created in Lima VM"
}

# Test database connectivity
test_database() {
    log_step "Testing database connectivity..."
    
    log_info "Testing basic queries..."
    limactl shell "$LIMA_INSTANCE" -- sqlite3 "$DB_PATH" ".tables"
    
    local user_count=$(limactl shell "$LIMA_INSTANCE" -- sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users;")
    log_success "Database test passed - Users: $user_count"
}

# Display final information
show_completion_info() {
    log_step "🎉 KernelQ Lima Setup Complete!"
    echo ""
    log_info "Lima VM Details:"
    log_info "  Instance: $LIMA_INSTANCE"
    log_info "  Template: $LIMA_TEMPLATE"
    log_info "  Status: $(limactl list | grep "^$LIMA_INSTANCE" | awk '{print $2}')"
    echo ""
    log_info "Database Details:"
    log_info "  Location: $DB_PATH"
    log_info "  Backup Dir: $BACKUP_DIR"
    log_info "  Tables: $(limactl shell "$LIMA_INSTANCE" -- sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")"
    echo ""
    log_info "Quick Commands:"
    log_info "  Access VM: limactl shell $LIMA_INSTANCE"
    log_info "  Check tables: limactl shell $LIMA_INSTANCE -- sqlite3 $DB_PATH '.tables'"
    log_info "  View schema: limactl shell $LIMA_INSTANCE -- sqlite3 $DB_PATH '.schema'"
    log_info "  Count users: limactl shell $LIMA_INSTANCE -- sqlite3 $DB_PATH 'SELECT COUNT(*) FROM users;'"
    log_info "  Create backup: limactl shell $LIMA_INSTANCE -- /home/zerohexer/kernelq-backup.sh"
    echo ""
    log_info "Start Backend:"
    log_info "  limactl shell $LIMA_INSTANCE -- sh -c 'cd $PROJECT_DIR/backend && npm start'"
    echo ""
    log_success "Ready for KernelQ development! 🐧"
}

# Main function
main() {
    echo "Prerequisites: limactl installed ✅"
    echo "This script will create everything from scratch..."
    echo ""
    
    check_lima
    
    # Only create new VM if needed
    if check_existing_instance; then
        create_lima_vm
        install_dependencies
        setup_directories
        install_backend_deps
        initialize_database
        verify_database
        create_backup_script
        test_database
    else
        log_info "Using existing Lima VM, setting up database only..."
        setup_directories
        install_backend_deps
        initialize_database
        verify_database
        create_backup_script
        test_database
    fi
    
    show_completion_info
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