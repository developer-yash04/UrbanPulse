#!/bin/sh

set -e

echo "Waiting for MySQL to be ready..."
until mysqladmin ping -h mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" --silent; do
    echo "MySQL is unavailable - sleeping"
    sleep 2
done

echo "MySQL is up - executing command"

echo "Generating Prisma Client..."
npx prisma generate

echo "Pushing database schema..."
npx prisma db push

echo "Seeding database..."
node prisma/seed.js || echo "Seed failed or already seeded"

echo "Starting server..."
exec node server.js