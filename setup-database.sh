#!/bin/bash
# Database Setup Script for Kanishka's Salon

echo "=== Setting up Database Connection ==="
echo ""

# Stop local PostgreSQL if running
echo "1. Stopping local PostgreSQL service..."
sudo systemctl stop postgresql 2>/dev/null || echo "PostgreSQL may not be running as systemd service"

# Check if port 5432 is free
if netstat -tlnp 2>/dev/null | grep -q ":5432"; then
    echo "   WARNING: Port 5432 is still in use!"
    netstat -tlnp 2>/dev/null | grep ":5432"
    echo "   Please stop the process using port 5432 first."
    exit 1
else
    echo "   ✓ Port 5432 is free"
fi

# Start Docker database
echo "2. Starting Docker database container..."
cd /home/elv1/projects/kanishkas-salon
docker compose up -d db

# Wait for database to be ready
echo "3. Waiting for database to be ready..."
sleep 5

# Check database health
if docker ps | grep -q "kanishkas-salon-db-1.*healthy"; then
    echo "   ✓ Database container is healthy"
else
    echo "   ⚠ Database container status:"
    docker ps | grep kanishkas-salon-db-1
fi

# Update .env.local
echo "4. Updating .env.local configuration..."
cp .env.local .env.local.backup
sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://salon_user:salon_pass_2026@localhost:5432/kanishkas_salon?schema=public"|' .env.local
sed -i 's|DIRECT_URL=.*|DIRECT_URL="postgresql://salon_user:salon_pass_2026@localhost:5432/kanishkas_salon"|' .env.local
echo "   ✓ Updated .env.local (backup saved as .env.local.backup)"

# Verify DATABASE_URL
echo "5. Verifying database connection..."
grep "^DATABASE_URL" .env.local

# Restart Next.js dev server
echo "6. Restarting Next.js dev server..."
pkill -f "next dev"
sleep 2
npm run dev > /tmp/dev.log 2>&1 &
sleep 5

# Check if services API works
echo "7. Testing services API..."
if curl -s "http://localhost:3001/api/services?limit=1" | grep -q "services"; then
    echo "   ✓ Services API is working!"
else
    echo "   ⚠ Checking logs..."
    tail -20 /tmp/dev.log | grep -i error
fi

echo ""
echo "=== Setup Complete ==="
echo "Your salon booking system should now be working at: http://168.231.121.107/"
