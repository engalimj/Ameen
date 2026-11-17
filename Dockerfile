# Ameen web app. Data (SQLite database and photos) lives on a volume at /data.
FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build

ENV NODE_ENV=production \
    TZ=Asia/Riyadh \
    DATABASE_URL=file:/data/ameen.db \
    UPLOAD_DIR=/data/uploads \
    PORT=3000
EXPOSE 3000
CMD ["./scripts/start.sh"]
