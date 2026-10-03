#!/bin/sh
set -e

echo "Deploying Prisma schema..."
npx prisma db push --accept-data-loss --skip-generate

echo "Starting Fastify API server..."
npm run start
