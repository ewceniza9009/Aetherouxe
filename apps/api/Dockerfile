FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app
# Whole monorepo is the build context (workspaces resolve locally)
COPY . .
RUN npm ci
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build
RUN chown -R node:node /app
USER node
EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push && node dist/src/main"]
