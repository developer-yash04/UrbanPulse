FROM node:20-alpine

RUN apk add --no-cache mysql-client

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY prisma ./prisma/

RUN npx prisma generate

COPY . .

RUN mkdir -p uploads

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]