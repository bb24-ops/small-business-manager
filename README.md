# Small Business Manager

Početna struktura web aplikacije za upravljanje resursima i obavezama malih preduzeća, razvijene u okviru diplomskog rada na FON-u.

## Tehnologije

- Frontend: React, TypeScript i Vite
- Backend: NestJS i TypeScript
- Baza: MySQL 8.4 LTS kroz Docker Compose
- ORM: Prisma

## Preduslovi

- Node.js LTS i npm
- Git
- Docker Desktop sa Docker Compose dodatkom

## Prvo pokretanje

Korenski `.env` fajl sadrži lokalne razvojne vrednosti i nije obuhvaćen Git verzionisanjem. Za novo okruženje kopirati `.env.example` u `.env` i zameniti primer lozinke.

Pokretanje baze iz korena projekta:

```powershell
docker compose up -d
```

Primena Prisma migracija i pokretanje backend-a:

```powershell
cd backend
npm run prisma:migrate -- --name init
npm run start:dev
```

Backend je dostupan na `http://localhost:3001`, a health ruta na `http://localhost:3001/api/health`.

Pokretanje frontend-a u drugom terminalu:

```powershell
cd frontend
npm run dev
```

Frontend je dostupan na `http://localhost:5174`.

Ovi portovi su izabrani kako se projekat ne bi sukobio sa drugim lokalnim Docker servisima koji već koriste standardne portove `3306`, `3000` i `5173`.

## Korisne komande

```powershell
# Zaustavljanje baze
docker compose down

# Zaustavljanje baze i brisanje lokalnog volumena sa podacima
docker compose down -v

# Frontend provere
cd frontend
npm run lint
npm run build

# Backend provere
cd backend
npm run lint
npm test
npm run build
```

Poslovni moduli, autentifikacija, korisnici, zadaci i resursi još nisu implementirani.
