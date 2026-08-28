# Small Business Manager

Početna struktura web aplikacije za upravljanje resursima i obavezama malih preduzeća, razvijene u okviru diplomskog rada na FON-u.

## Tehnologije

- Frontend: React, TypeScript i Vite
- Backend: NestJS i TypeScript
- Baza: MySQL 8.4 LTS kroz Docker Compose
- ORM: Prisma
- UI i serverski podaci: Material UI i TanStack Query

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
npm.cmd run prisma:deploy
npm.cmd run start:dev
```

Backend je dostupan na `http://localhost:3001`, a health ruta na `http://localhost:3001/api/health`.
Swagger dokumentacija dostupna je na `http://localhost:3001/api/docs`.

Pokretanje frontend-a u drugom terminalu:

```powershell
cd frontend
npm.cmd run dev
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
npm.cmd run lint
npm.cmd run build

# Backend provere
cd backend
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
```

## Trenutno implementirano

- provera dostupnosti backend-a;
- Prisma modeli i migracija za kategorije i poslovne resurse;
- CRUD REST API za kategorije i resurse;
- validacija ulaznih podataka i obrada konflikata;
- pretraga i filtriranje resursa prema statusu i kategoriji;
- kontrolna tabla sa osnovnim statistikama;
- forma za dodavanje kategorije;
- dodavanje, izmena i brisanje resursa kroz React interfejs;
- Swagger/OpenAPI dokumentacija;
- unit i end-to-end testovi.

Autentifikacija, korisnici, zadaci, rezervacije i ostali poslovni moduli još nisu implementirani.
