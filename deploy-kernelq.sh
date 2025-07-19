#!/bin/bash

# KernelOne Production Deployment Script for kernelq.com
# This script deploys the KernelOne app to production with proper environment setup

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="kernelq.com"
BACKEND_PORT=3001
FRONTEND_PORT=3000
BUILD_DIR="build"
DIST_DIR="dist"

echo -e "${PURPLE}🚀 KernelOne Production Deployment for ${DOMAIN}${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Deployment interrupted...${NC}"
    exit 1
}

trap cleanup INT

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install missing dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Checking dependencies...${NC}"
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("nodejs")
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if ! command_exists nginx; then
        missing_deps+=("nginx")
    fi
    
    if ! command_exists certbot; then
        missing_deps+=("certbot python3-certbot-nginx")
    fi
    
    if ! command_exists pm2; then
        echo -e "${YELLOW}Installing PM2 globally...${NC}"
        npm install -g pm2
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${YELLOW}Installing missing dependencies: ${missing_deps[*]}${NC}"
        sudo apt update
        sudo apt install -y "${missing_deps[@]}"
    fi
    
    echo -e "${GREEN}✅ Dependencies ready${NC}"
}

# Function to build frontend
build_frontend() {
    echo -e "${BLUE}⚛️ Building React frontend for production...${NC}"
    
    # Set production environment variables
    export NODE_ENV=production
    export REACT_APP_BACKEND_URL="https://api.${DOMAIN}"
    export GENERATE_SOURCEMAP=false
    
    # Clean previous build
    rm -rf ${BUILD_DIR}
    
    # Install dependencies and build
    npm ci --only=production
    npm run build
    
    if [ ! -d "${BUILD_DIR}" ]; then
        echo -e "${RED}❌ Frontend build failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
}

# Function to prepare backend
prepare_backend() {
    echo -e "${BLUE}🔧 Preparing backend for production...${NC}"
    
    cd backend
    
    # Install production dependencies
    npm ci --only=production
    
    # Create production environment file
    cat > .env.production << EOF
NODE_ENV=production
PORT=${BACKEND_PORT}
CORS_ORIGIN=https://${DOMAIN}
LOG_LEVEL=info
EOF
    
    cd ..
    echo -e "${GREEN}✅ Backend prepared${NC}"
}

# Function to create nginx configuration
setup_nginx() {
    echo -e "${BLUE}🌐 Setting up Nginx configuration...${NC}"
    
    # Create nginx config for the domain
    sudo tee /etc/nginx/sites-available/${DOMAIN} > /dev/null << EOF
# KernelOne Frontend (kernelq.com)
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # Redirect to HTTPS
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # SSL Configuration (will be handled by certbot)
    # ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Root directory for React build
    root $(pwd)/${BUILD_DIR};
    index index.html;
    
    # Handle React Router (SPA)
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Static assets with long cache
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Service worker
    location /sw.js {
        expires 0;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}

# KernelOne API Backend (api.kernelq.com)
server {
    listen 80;
    server_name api.${DOMAIN};
    
    # Redirect to HTTPS
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.${DOMAIN};
    
    # SSL Configuration (will be handled by certbot)
    # ssl_certificate /etc/letsencrypt/live/api.${DOMAIN}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/api.${DOMAIN}/privkey.pem;
    
    # Security headers for API
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Node.js backend
    location / {
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://localhost:${BACKEND_PORT}/api/health;
    }
}
EOF
    
    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
    
    # Test nginx configuration
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Nginx configuration created${NC}"
    else
        echo -e "${RED}❌ Nginx configuration error${NC}"
        exit 1
    fi
}

# Function to setup SSL certificates
setup_ssl() {
    echo -e "${BLUE}🔒 Setting up SSL certificates with Let's Encrypt...${NC}"
    
    # Stop nginx temporarily for certificate generation
    sudo systemctl stop nginx
    
    # Generate certificates for both domains
    sudo certbot certonly --standalone \
        --email admin@${DOMAIN} \
        --agree-tos \
        --no-eff-email \
        -d ${DOMAIN} \
        -d www.${DOMAIN} \
        -d api.${DOMAIN}
    
    if [ $? -eq 0 ]; then
        # Update nginx config with SSL
        sudo sed -i 's/# ssl_certificate/ssl_certificate/g' /etc/nginx/sites-available/${DOMAIN}
        echo -e "${GREEN}✅ SSL certificates obtained${NC}"
    else
        echo -e "${RED}❌ SSL certificate generation failed${NC}"
        exit 1
    fi
}

# Function to create PM2 ecosystem file
create_pm2_config() {
    echo -e "${BLUE}📋 Creating PM2 configuration...${NC}"
    
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'kernelone-backend',
      script: 'backend/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: ${BACKEND_PORT}
      },
      log_file: './logs/kernelone.log',
      error_file: './logs/kernelone-error.log',
      out_file: './logs/kernelone-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:SS',
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log'],
      instance_var: 'INSTANCE_ID'
    }
  ]
};
EOF
    
    # Create logs directory
    mkdir -p logs
    
    echo -e "${GREEN}✅ PM2 configuration created${NC}"
}

# Function to deploy application
deploy_application() {
    echo -e "${BLUE}🚀 Deploying KernelOne application...${NC}"
    
    # Stop any existing PM2 processes
    pm2 delete kernelone-backend 2>/dev/null || true
    
    # Start backend with PM2
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup
    pm2 startup
    
    echo -e "${GREEN}✅ Application deployed with PM2${NC}"
}

# Function to setup firewall
setup_firewall() {
    echo -e "${BLUE}🔥 Configuring firewall...${NC}"
    
    # Allow SSH, HTTP, and HTTPS
    sudo ufw allow ssh
    sudo ufw allow 'Nginx Full'
    sudo ufw --force enable
    
    echo -e "${GREEN}✅ Firewall configured${NC}"
}

# Function to start services
start_services() {
    echo -e "${BLUE}🎯 Starting services...${NC}"
    
    # Start and enable nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    # Reload nginx with new configuration
    sudo systemctl reload nginx
    
    echo -e "${GREEN}✅ Services started${NC}"
}

# Function to setup monitoring
setup_monitoring() {
    echo -e "${BLUE}📊 Setting up basic monitoring...${NC}"
    
    # Create a simple monitoring script
    cat > monitor.sh << 'EOF'
#!/bin/bash
# Simple monitoring script for KernelOne

echo "=== KernelOne Health Check $(date) ==="
echo ""

# Check Nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Running"
else
    echo "❌ Nginx: Stopped"
fi

# Check PM2 processes
echo "📱 PM2 Status:"
pm2 status

# Check disk space
echo ""
echo "💾 Disk Usage:"
df -h / | tail -1

# Check memory
echo ""
echo "🧠 Memory Usage:"
free -h

# Check SSL certificate expiry
echo ""
echo "🔒 SSL Certificate Status:"
certbot certificates 2>/dev/null | grep -A2 "${DOMAIN}" || echo "No certificates found"

echo ""
echo "==============================================="
EOF
    
    chmod +x monitor.sh
    
    echo -e "${GREEN}✅ Monitoring setup complete${NC}"
}

# Function to create backup script
create_backup_script() {
    echo -e "${BLUE}💾 Creating backup script...${NC}"
    
    cat > backup.sh << EOF
#!/bin/bash
# Backup script for KernelOne

BACKUP_DIR="/var/backups/kernelone"
DATE=\$(date +%Y%m%d_%H%M%S)

# Create backup directory
sudo mkdir -p \$BACKUP_DIR

# Backup application files
sudo tar -czf \$BACKUP_DIR/kernelone_\$DATE.tar.gz \\
    --exclude=node_modules \\
    --exclude=build \\
    --exclude=logs \\
    .

# Backup nginx configuration
sudo cp /etc/nginx/sites-available/${DOMAIN} \$BACKUP_DIR/nginx_\$DATE.conf

# Keep only last 7 backups
sudo find \$BACKUP_DIR -name "kernelone_*.tar.gz" -mtime +7 -delete
sudo find \$BACKUP_DIR -name "nginx_*.conf" -mtime +7 -delete

echo "Backup completed: \$BACKUP_DIR/kernelone_\$DATE.tar.gz"
EOF
    
    chmod +x backup.sh
    
    echo -e "${GREEN}✅ Backup script created${NC}"
}

# Main deployment flow
main() {
    echo -e "${CYAN}Starting deployment process...${NC}"
    echo ""
    
    # Pre-deployment checks
    if [ "$EUID" -eq 0 ]; then
        echo -e "${RED}❌ Don't run this script as root${NC}"
        exit 1
    fi
    
    # Check if domain is properly configured
    echo -e "${YELLOW}⚠️ Make sure ${DOMAIN} and api.${DOMAIN} point to this server's IP${NC}"
    read -p "Press Enter to continue once DNS is configured..."
    
    # Run deployment steps
    install_dependencies
    echo ""
    
    build_frontend
    echo ""
    
    prepare_backend
    echo ""
    
    setup_nginx
    echo ""
    
    setup_ssl
    echo ""
    
    create_pm2_config
    echo ""
    
    deploy_application
    echo ""
    
    setup_firewall
    echo ""
    
    start_services
    echo ""
    
    setup_monitoring
    echo ""
    
    create_backup_script
    echo ""
    
    # Final status
    echo -e "${GREEN}🎉 KernelOne deployment completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📱 Your application is now live at:${NC}"
    echo -e "   🌐 Frontend: ${GREEN}https://${DOMAIN}${NC}"
    echo -e "   🔧 Backend API: ${GREEN}https://api.${DOMAIN}${NC}"
    echo ""
    echo -e "${YELLOW}📋 Useful commands:${NC}"
    echo -e "   📊 Check status: ${CYAN}pm2 status${NC}"
    echo -e "   📄 View logs: ${CYAN}pm2 logs kernelone-backend${NC}"
    echo -e "   🔄 Restart app: ${CYAN}pm2 restart kernelone-backend${NC}"
    echo -e "   📊 Monitor: ${CYAN}./monitor.sh${NC}"
    echo -e "   💾 Backup: ${CYAN}./backup.sh${NC}"
    echo ""
    echo -e "${YELLOW}🔒 SSL certificates will auto-renew via systemd timer${NC}"
    echo -e "${YELLOW}🔥 Firewall is enabled (SSH, HTTP, HTTPS only)${NC}"
    echo ""
    echo -e "${PURPLE}🚀 KernelOne is ready for production on ${DOMAIN}!${NC}"
}

# Run main function
main "$@"