FROM nginx:latest

# Install Certbot and dependencies
RUN apt update && \
   apt install -y certbot python3-certbot-nginx bash curl && \
   apt clean

# Create directory for Let's Encrypt
RUN mkdir -p /etc/letsencrypt

# Copy your nginx.conf and site configs
COPY nginx.conf /etc/nginx/nginx.conf
#COPY ./html /usr/share/nginx/html

# Add startup script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN ls -l /entrypoint.sh && head -n 5 /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
