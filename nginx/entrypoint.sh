#!/bin/sh

# Replace this with your domain and email

DOMAIN=visitors.pranathiss.com 
EMAIL=suresh@vitelglobal.com

# Wait for nginx to be ready
nginx &

# Sleep for a few seconds to let nginx boot
sleep 5

# Request SSL Certificate using certbot
certbot --nginx -n --agree-tos --email "$EMAIL" -d "$DOMAIN"

# Reload nginx with new SSL
nginx -s reload

# Keep container running
tail -f /var/log/nginx/access.log
