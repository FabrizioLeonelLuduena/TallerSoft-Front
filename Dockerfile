# Multi-stage build for Angular frontend with nginx
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=1536
RUN npm run build -- --configuration production

# Production stage with nginx
FROM nginx:alpine

# Pre-crear directorios de cache de nginx con permisos abiertos
RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp \
    && chmod -R 777 /var/cache/nginx \
    && touch /var/run/nginx.pid \
    && chmod 666 /var/run/nginx.pid

RUN rm -rf /etc/nginx/conf.d/*
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/tallersoft-frontend /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -qO /dev/null http://127.0.0.1:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
