#!/bin/bash

# SSL Certificate Generation Script for Production Deployment
# This script generates self-signed certificates for development/testing
# For production, replace with Let's Encrypt or commercial certificates

set -e

echo "🔐 Setting up SSL certificates for production deployment..."

# Create SSL directory
SSL_DIR="./ssl"
mkdir -p "$SSL_DIR"

# Check if certificates already exist
if [[ -f "$SSL_DIR/server.crt" && -f "$SSL_DIR/server.key" ]]; then
    echo "ℹ️  SSL certificates already exist. Skipping generation."
    echo "   To regenerate, delete the ssl/ directory and run this script again."
    exit 0
fi

# Certificate configuration
COUNTRY="US"
STATE="State"
CITY="City"
ORGANIZATION="Your Organization"
ORGANIZATIONAL_UNIT="IT Department"
COMMON_NAME="localhost"
EMAIL="admin@yourcompany.com"

# Certificate validity (days)
DAYS=365

echo "📋 Generating SSL certificate with the following details:"
echo "   Country: $COUNTRY"
echo "   State: $STATE"
echo "   City: $CITY"
echo "   Organization: $ORGANIZATION"
echo "   Common Name: $COMMON_NAME"
echo "   Validity: $DAYS days"
echo

# Generate private key
echo "🔑 Generating private key..."
openssl genrsa -out "$SSL_DIR/server.key" 2048

# Generate certificate signing request
echo "📝 Generating certificate signing request..."
openssl req -new -key "$SSL_DIR/server.key" -out "$SSL_DIR/server.csr" -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORGANIZATION/OU=$ORGANIZATIONAL_UNIT/CN=$COMMON_NAME/emailAddress=$EMAIL"

# Generate self-signed certificate
echo "📜 Generating self-signed certificate..."
openssl x509 -req -days $DAYS -in "$SSL_DIR/server.csr" -signkey "$SSL_DIR/server.key" -out "$SSL_DIR/server.crt"

# Generate Diffie-Hellman parameters for enhanced security
echo "🔐 Generating Diffie-Hellman parameters (this may take a while)..."
openssl dhparam -out "$SSL_DIR/dhparam.pem" 2048

# Set appropriate permissions
echo "🔒 Setting certificate permissions..."
chmod 600 "$SSL_DIR/server.key"
chmod 644 "$SSL_DIR/server.crt"
chmod 644 "$SSL_DIR/dhparam.pem"

# Clean up CSR file
rm "$SSL_DIR/server.csr"

echo "✅ SSL certificates generated successfully!"
echo
echo "📁 Certificate files created:"
echo "   Private Key: $SSL_DIR/server.key"
echo "   Certificate: $SSL_DIR/server.crt"
echo "   DH Params: $SSL_DIR/dhparam.pem"
echo
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "   1. These are self-signed certificates for development/testing"
echo "   2. For production, use certificates from a trusted CA (Let's Encrypt, etc.)"
echo "   3. Keep the private key secure and never commit it to version control"
echo "   4. Consider using automated certificate management for production"
echo
echo "🚀 Ready for deployment! Run './deploy.sh' to start the application."

# Create Let's Encrypt configuration template
cat > "$SSL_DIR/letsencrypt-setup.sh" << 'EOF'
#!/bin/bash

# Let's Encrypt Certificate Setup (Production)
# Uncomment and configure for production use with real domain

set -e

DOMAIN="yourdomain.com"
EMAIL="admin@yourdomain.com"

echo "🔐 Setting up Let's Encrypt certificates for $DOMAIN..."

# Install certbot if not available
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# Generate certificate
echo "📜 Generating Let's Encrypt certificate..."
sudo certbot certonly --standalone \
    --preferred-challenges http \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

# Copy certificates to project directory
echo "📋 Copying certificates..."
sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "./server.crt"
sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "./server.key"

# Set permissions
sudo chown $USER:$USER "./server.crt" "./server.key"
chmod 644 "./server.crt"
chmod 600 "./server.key"

echo "✅ Let's Encrypt certificates configured!"
echo "   Certificate: ./server.crt"
echo "   Private Key: ./server.key"

# Setup auto-renewal
echo "🔄 Setting up auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

echo "✅ Auto-renewal configured!"
EOF

chmod +x "$SSL_DIR/letsencrypt-setup.sh"

echo "📋 Let's Encrypt setup script created: $SSL_DIR/letsencrypt-setup.sh"
echo "   Edit the domain and email, then run it for production certificates."
