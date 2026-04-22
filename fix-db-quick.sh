#!/bin/bash
# Quick fix for database connection - uses existing PostgreSQL

echo "=== Fixing Database Connection ==="
echo ""

# Try to connect using peer authentication as postgres user
echo "Attempting to set up database and user..."

# Create database and user if they don't exist
sudo -u postgres psql <<EOF 2>/dev/null
CREATE DATABASE kanishkas_salon;
\\du salon_user >/dev/null 2>&1 || CREATE USER salon_user WITH PASSWORD 'salon_pass_2026' SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE kanishkas_salon TO salon_user;
EOF

if [ $? -eq 0 ]; then
    echo "✓ Database and user configured successfully"
    
    # Update .env.local
    cd /home/elv1/projects/kanishkas-salon
    cp .env.local .env.local.backup
    
    cat > .env.local <<ENVEOF
DATABASE_URL="postgresql://salon_user:salon_pass_2026@localhost:5432/kanishkas_salon?schema=public"
DIRECT_URL="postgresql://salon_user:salon_pass_2026@localhost:5432/kanishkas_salon"
ENVEOF
    
    echo "✓ Updated .env.local"
    
    # Restart dev server
    echo "✓ Restarting Next.js dev server..."
    pkill -f "next dev"
    sleep 2
    npm run dev > /tmp/dev.log 2>&1 &
    sleep 5
    
    # Test
    echo "✓ Testing services API..."
    curl -s "http://localhost:3001/api/services?limit=1" | head -50
    
    echo ""
    echo "=== Complete! Test at http://168.231.121.107/book ==="
else
    echo "✗ Could not configure database (sudo password required)"
    echo ""
    echo "Manual fix needed:"
    echo "1. Run: sudo -u postgres psql"
    echo "2. Execute these SQL commands:"
    echo "   CREATE DATABASE kanishkas_salon;"
    echo "   CREATE USER salon_user WITH PASSWORD 'salon_pass_2026' SUPERUSER;"
    echo "   GRANT ALL PRIVILEGES ON DATABASE kanishkas_salon TO salon_user;"
    echo "3. Then update .env.local with the DATABASE_URL"
fi
