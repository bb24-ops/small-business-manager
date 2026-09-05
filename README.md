# Small Business Manager

Početna struktura web aplikacije za upravljanje resursima i obavezama malih preduzeća, razvijene u okviru diplomskog rada na FON-u.

## Tehnologije

- Frontend: React, TypeScript, Vite i React Router
- Backend: NestJS i TypeScript, uz JWT autentifikaciju
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

Primena Prisma migracija, kreiranje početnog administratora i pokretanje backend-a:

```powershell
cd backend
npm.cmd run prisma:deploy
npm.cmd run prisma:seed
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
- Prisma model i migracija za poslovne zadatke;
- Prisma model i migracija za zaposlene i dodelu zadataka;
- CRUD REST API za kategorije i resurse;
- validacija ulaznih podataka i obrada konflikata;
- pretraga i filtriranje resursa prema statusu i kategoriji;
- kontrolna tabla sa osnovnim statistikama;
- zasebne rute `/dashboard` i `/resources`, uz 404 stranicu;
- responzivna desktop i mobilna navigacija;
- dashboard statistika po statusu i kategoriji;
- prikaz poslednje ažuriranih resursa;
- forma za dodavanje kategorije;
- dodavanje, izmena i brisanje resursa kroz React interfejs;
- CRUD zadataka sa početkom, rokom, prioritetom i statusom;
- automatsko određivanje statusa „Za uraditi”, „U toku” i „Kasni” prema planiranom terminu;
- ručna potvrda završetka zadatka uz evidentiranje vremena završavanja;
- CRUD zaposlenih sa kontaktom, pozicijom i statusom;
- dodeljivanje zadatka jednom aktivnom zaposlenom;
- sprečavanje vremenskog preklapanja aktivnih zadataka istog zaposlenog;
- zaštita od brisanja zaposlenog koji ima dodeljene zadatke;
- povezivanje zadatka sa jednim ili više potrebnih resursa;
- evidentiranje ukupne količine svake vrste resursa;
- izbor potrebne količine resursa prilikom kreiranja zadatka;
- automatski prikaz trenutno zauzete i dostupne količine resursa;
- kalendarski prikaz zadataka po mesecu, nedelji i danu;
- filtriranje kalendara prema zaposlenom, resursu i statusu zadatka;
- prikaz detalja zadatka izborom događaja u kalendaru;
- automatsko kreiranje i ažuriranje rezervacija prema terminu zadatka;
- sprečavanje rezervacija koje bi u istom terminu premašile raspoloživu količinu;
- pregled i filtriranje rezervacija na ruti `/reservations`;
- pretraga i filtriranje zadataka na ruti `/tasks`;
- pregled broja i predstojećih zadataka na kontrolnoj tabli;
- Swagger/OpenAPI dokumentacija;
- prijavljivanje email adresom i lozinkom, uz osmočasovni JWT token;
- bezbedno čuvanje lozinki pomoću bcrypt hashiranja;
- administratorski i zaposleni korisnički nalozi;
- administratorsko upravljanje korisničkim nalozima na ruti `/users`;
- serverska kontrola pristupa i ograničavanje zaposlenog na njegove zadatke i rezervacije;
- unit i end-to-end testovi.

## Glavne adrese

- Kontrolna tabla: `http://localhost:5174/dashboard`
- Resursi: `http://localhost:5174/resources`
- Zadaci: `http://localhost:5174/tasks`
- Zaposleni: `http://localhost:5174/employees`
- Rezervacije: `http://localhost:5174/reservations`
- Kalendar: `http://localhost:5174/calendar`
- Prijavljivanje: `http://localhost:5174/login`
- Korisnički nalozi: `http://localhost:5174/users`
- Tasks API: `http://localhost:3001/api/tasks`
- Employees API: `http://localhost:3001/api/employees`
- Reservations API: `http://localhost:3001/api/reservations`
- Dashboard API: `http://localhost:3001/api/dashboard/stats`
- Swagger: `http://localhost:3001/api/docs`
