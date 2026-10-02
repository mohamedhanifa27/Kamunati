#!/bin/sh
set -e

echo "Deploying Prisma migrations..."
npx prisma migrate deploy

echo "Starting Fastify API server..."
npm run start
