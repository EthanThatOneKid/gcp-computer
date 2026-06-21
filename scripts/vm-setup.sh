#!/bin/bash
set -e

echo "=== VM Setup Script Starting ==="

# 1. Update package lists
sudo apt-get update -y

# 2. Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# 3. Create database and user
echo "Configuring PostgreSQL database..."
sudo -u postgres psql -c "CREATE USER gcp_computer WITH PASSWORD 'gcp-computer-secure-pass';" || echo "User already exists"
sudo -u postgres psql -c "ALTER USER gcp_computer WITH PASSWORD 'gcp-computer-secure-pass';"
sudo -u postgres psql -c "CREATE DATABASE gcp_computer OWNER gcp_computer;" || echo "Database already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE gcp_computer TO gcp_computer;"

# 4. Install Node.js 22 LTS
echo "Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 5. Install Caddy
echo "Installing Caddy..."
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg || true
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update -y
sudo apt-get install -y caddy

# 6. Configure Caddyfile
echo "Configuring Caddy..."
sudo tee /etc/caddy/Caddyfile > /dev/null <<EOF
gcp-computer.etok.me {
    reverse_proxy localhost:3000
}
EOF

sudo systemctl restart caddy

# 7. Create app directory with correct permissions
sudo mkdir -p /opt/gcp-computer
sudo chown -R ubuntu:ubuntu /opt/gcp-computer

echo "=== VM Setup Script Finished Successfully! ==="
