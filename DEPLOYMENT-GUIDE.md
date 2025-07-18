# KernelOne Production Deployment Guide for kernelq.com

This guide walks you through deploying KernelOne to production on your kernelq.com domain.

## Prerequisites

### 1. Server Requirements
- Ubuntu 20.04+ or similar Linux distribution
- Minimum 2GB RAM, 2 CPU cores
- 20GB+ disk space
- Root access via sudo

### 2. Domain Setup
- Point `kernelq.com` to your server's IP address
- Point `api.kernelq.com` to your server's IP address  
- Point `www.kernelq.com` to your server's IP address
- Wait for DNS propagation (up to 24 hours)

### 3. Server Initial Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install basic tools
sudo apt install -y curl wget git unzip

# Create a deployment user (optional but recommended)
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG sudo deploy
sudo su - deploy
```

## Deployment Steps

### 1. Clone Repository
```bash
cd /home/deploy  # or your preferred directory
git clone https://github.com/zerohexer/KernelOne.git
cd KernelOne
```

### 2. Run Deployment Script
```bash
# Make sure DNS is configured first!
./deploy-kernelq.sh
```

The script will:
- ✅ Install all dependencies (Node.js, Nginx, Certbot, PM2)
- ✅ Build React frontend for production
- ✅ Configure Nginx with SSL/HTTPS
- ✅ Setup Let's Encrypt certificates  
- ✅ Deploy backend with PM2 process manager
- ✅ Configure firewall rules
- ✅ Setup monitoring and backup scripts

### 3. Verify Deployment
```bash
# Check PM2 status
pm2 status

# Check Nginx status  
sudo systemctl status nginx

# Check SSL certificates
sudo certbot certificates

# Run health check
./monitor.sh
```

## Post-Deployment

### URLs
- **Frontend**: https://kernelq.com
- **API**: https://api.kernelq.com
- **Admin**: PM2 dashboard on server

### Monitoring
```bash
# View application logs
pm2 logs kernelone-backend

# Monitor system resources
./monitor.sh

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Backups
```bash
# Create backup
./backup.sh

# Backups stored in: /var/backups/kernelone/
```

### Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild frontend
npm run build

# Restart backend
pm2 restart kernelone-backend

# Reload Nginx (if config changed)
sudo systemctl reload nginx
```

### SSL Certificate Renewal
Certificates auto-renew via systemd timer. To check:
```bash
# Check renewal timer
sudo systemctl status certbot.timer

# Test renewal (dry run)
sudo certbot renew --dry-run
```

## Troubleshooting

### Common Issues

#### 1. SSL Certificate Generation Failed
```bash
# Check if port 80 is free
sudo netstat -tlnp | grep :80

# Stop Nginx temporarily
sudo systemctl stop nginx

# Try manual certificate generation
sudo certbot certonly --standalone -d kernelq.com -d www.kernelq.com -d api.kernelq.com
```

#### 2. Backend Not Starting
```bash
# Check PM2 logs
pm2 logs kernelone-backend

# Check if port 3001 is available
sudo netstat -tlnp | grep :3001

# Restart PM2
pm2 restart kernelone-backend
```

#### 3. Frontend Build Fails
```bash
# Clear cache and rebuild
npm cache clean --force
rm -rf node_modules build
npm install
npm run build
```

#### 4. Nginx Configuration Error
```bash
# Test configuration
sudo nginx -t

# Check Nginx logs
sudo journalctl -u nginx.service

# Reload configuration
sudo systemctl reload nginx
```

### Performance Optimization

#### 1. Enable Nginx Caching
Add to nginx configuration:
```nginx
# Cache static files
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### 2. Setup Node.js Clustering
PM2 automatically enables clustering with `instances: 'max'`

#### 3. Database Optimization (if using)
- Setup connection pooling
- Add database indexes
- Enable query caching

## Security Checklist

- ✅ HTTPS enforced with SSL certificates
- ✅ Firewall configured (UFW) 
- ✅ Security headers in Nginx
- ✅ PM2 process isolation
- ✅ Non-root deployment user
- ✅ Automatic security updates

### Additional Security (Recommended)
```bash
# Setup fail2ban for SSH protection
sudo apt install fail2ban

# Configure automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

## Scaling (Future)

### Load Balancing
- Add multiple server instances
- Setup Nginx load balancer
- Use Redis for session storage

### Database
- Setup PostgreSQL/MySQL
- Configure database backups
- Setup read replicas

### CDN
- Configure Cloudflare
- Setup static asset CDN
- Enable image optimization

## Support

- 📖 Documentation: Check README files
- 🐛 Issues: GitHub issues
- 📧 Contact: admin@kernelq.com

---

**🚀 Happy deploying! Your KernelOne academy is ready for students worldwide!**