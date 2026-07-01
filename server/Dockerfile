# =====================================================================
# Backend (Express + PostgreSQL client)
# =====================================================================
FROM node:20-alpine
WORKDIR /app

# Dependencies produksi saja (pg, express, pdfkit, dll — semua pure JS,
# tidak ada native build sehingga aman di alpine).
COPY package.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 4000

# Jalankan migrasi (schema + seed, keduanya idempotent) lalu start server.
# `db` sudah dipastikan healthy lewat depends_on di docker-compose.
CMD ["sh", "-c", "npm run db:migrate && npm start"]
