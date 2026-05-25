# Elektronski dnevnik srednje škole

Fullstack web aplikacija: Node.js + Express + TypeScript (backend) i React + TypeScript (frontend), MySQL baza.

## Struktura projekta

```
projekt/
├── backend/      → Node.js API server
├── frontend/     → React aplikacija
└── database/     → SQL schema i inicijalni podaci
```

## Uloge korisnika

| Uloga | Funkcije |
|-------|----------|
| **Učenik** | Pregled svojih ocena po predmetima i tromesečjima |
| **Nastavnik** | Unos ocena (sa višestrukom potvrdom), zaključivanje ocena, zahtev za brisanje |
| **Admin** | Odobravanjem/odbijanje zahteva za brisanje ocena |

---

## Pokretanje na serveru

### 1. Baza podataka

```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Uredi .env i upiši svoje podatke za bazu i sesiju

npm install
npm run build
npm start
```

### 3. Frontend

```bash
cd frontend
npm install
npm run build
```

Frontend build (`dist/`) se automatski servira iz backenda.

---

## Demo nalozi

**Lozinka za sve:** `lozinka123`

| Korisničko ime | Uloga |
|----------------|-------|
| `admin` | Administrator |
| `petar.petrovic` | Nastavnik (Matematika, Fizika) |
| `marija.markovic` | Nastavnik (Srpski, Istorija, Engleski) |
| `jovan.jovanovic` | Učenik |
| `ana.anic` | Učenik |
| `nikola.nikolic` | Učenik |

---

## API endpointi

### Auth
- `POST /api/auth/prijava` — prijava
- `POST /api/auth/odjava` — odjava
- `GET /api/auth/ja` — trenutni korisnik

### Ocene
- `GET /api/ocene/moje` — učenikove ocene
- `GET /api/ocene/moji-ucenici` — nastavnikovi učenici
- `GET /api/ocene/moji-predmeti` — nastavnikovi predmeti
- `GET /api/ocene/ucenik/:id` — ocene učenika
- `POST /api/ocene` — unos ocene
- `GET /api/ocene/prosek/:ucenikId/:predmetId` — prosek i predlog zaključne
- `POST /api/ocene/zakljuci` — zaključivanje ocene
- `POST /api/ocene/zahtev-brisanje` — zahtev za brisanje ocene
- `GET /api/ocene/zahtevi-brisanje` — svi zahtevi (admin)
- `POST /api/ocene/zahtevi-brisanje/:id/obradi` — obrada zahteva (admin)

### Admin
- `GET /api/admin/ucenici` — svi učenici
- `GET /api/admin/nastavnici` — svi nastavnici

---

## Sigurnost

- Lozinke su hashirane bcrypt algoritmom
- Sesije su httpOnly cookie
- Trostruka validacija: frontend → backend → baza (trigeri)
- Ocene se ne mogu brisati direktno — samo kroz zahtev adminu
- Nastavnik može upisati ocenu samo za svoje predmete i svoje učenike
