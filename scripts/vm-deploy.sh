#!/bin/bash
set -e

echo "=== Extracting Build ==="
sudo tar -xzf $HOME/build.tar.gz -C /opt/gcp-computer
sudo chown -R ubuntu:ubuntu /opt/gcp-computer

echo "=== Moving GCP Key ==="
if [ -f $HOME/gcp-key.json ]; then
  sudo mv $HOME/gcp-key.json /opt/gcp-computer/gcp-key.json
fi
sudo chown ubuntu:ubuntu /opt/gcp-computer/gcp-key.json

echo "=== Moving .env file ==="
if [ -f $HOME/.env ]; then
  sudo mv $HOME/.env /opt/gcp-computer/.env
fi

# Remove existing database and nextauth url if any
sudo sed -i '/^DATABASE_URL=/d' /opt/gcp-computer/.env || true
sudo sed -i '/^NEXTAUTH_URL=/d' /opt/gcp-computer/.env || true

# Append VM specific database and URL values
echo 'DATABASE_URL="postgresql://gcp_computer:gcp-computer-secure-pass@localhost:5432/gcp_computer"' | sudo tee -a /opt/gcp-computer/.env > /dev/null
echo 'NEXTAUTH_URL="http://8.229.141.54"' | sudo tee -a /opt/gcp-computer/.env > /dev/null

sudo chmod 600 /opt/gcp-computer/.env
sudo chown ubuntu:ubuntu /opt/gcp-computer/.env

echo "=== Creating systemd service file ==="
sudo tee /etc/systemd/system/gcp-computer.service > /dev/null <<'EOF'
[Unit]
Description=GCP Computer Next.js App
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/gcp-computer
ExecStart=/usr/bin/node /opt/gcp-computer/server.js
EnvironmentFile=/opt/gcp-computer/.env
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=127.0.0.1
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

echo "=== Reloading systemd and restarting service ==="
sudo systemctl daemon-reload
sudo systemctl enable gcp-computer.service
sudo systemctl restart gcp-computer.service

echo "=== Service Status ==="
sudo systemctl status gcp-computer.service --no-pager || true

echo "=== Deployment Finished Successfully! ==="
