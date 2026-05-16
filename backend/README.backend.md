Backend overview

Location: /backend

Features:
- TypeScript + Express
- Prisma + PostgreSQL
- JWT access + refresh tokens
- Email via SMTP (Gmail supported)
- Security middlewares (helmet, rate-limit, hpp, csurf, xss-clean)
- Docker + docker-compose

Quickstart (development):
1. cd backend
2. cp .env.example .env  # edit values
3. npm install
4. npm run prisma:generate
5. npx prisma migrate dev --name init --preview-feature
6. npm run dev

Docker (local):
- docker-compose up --build

Environment variables: see .env.example
