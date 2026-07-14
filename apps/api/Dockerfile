FROM node:20-alpine
WORKDIR /app
# Whole monorepo is the build context (workspaces resolve locally)
COPY . .
RUN npm ci
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build
EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/main"]
