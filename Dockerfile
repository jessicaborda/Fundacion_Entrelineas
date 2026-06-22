FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist        ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
RUN mkdir -p dist/client/covers dist/client/galeria
COPY --from=builder /app/gallery.config.json ./dist/client/galeria/gallery.config.json
EXPOSE 4321
ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production
CMD ["node", "dist/server/entry.mjs"]
