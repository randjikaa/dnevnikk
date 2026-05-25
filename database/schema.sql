-- ============================================================
-- Elektronski dnevnik srednje škole
-- PostgreSQL verzija (za Supabase)
-- ============================================================

-- Tipovi
CREATE TYPE uloga_tip AS ENUM ('ucenik', 'nastavnik', 'admin');
CREATE TYPE status_tip AS ENUM ('na_cekanju', 'odobren', 'odbijen');

-- Korisnici
CREATE TABLE korisnici (
    id SERIAL PRIMARY KEY,
    korisnicko_ime VARCHAR(50) NOT NULL UNIQUE,
    lozinka_hash VARCHAR(255) NOT NULL,
    uloga uloga_tip NOT NULL,
    ime VARCHAR(100) NOT NULL,
    prezime VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    kreiran_u TIMESTAMP DEFAULT NOW()
);

-- Predmeti
CREATE TABLE predmeti (
    id SERIAL PRIMARY KEY,
    naziv VARCHAR(100) NOT NULL,
    opis TEXT
);

-- Nastavnici <-> Predmeti
CREATE TABLE nastavnici_predmeti (
    id SERIAL PRIMARY KEY,
    nastavnik_id INT NOT NULL REFERENCES korisnici(id),
    predmet_id INT NOT NULL REFERENCES predmeti(id),
    UNIQUE(nastavnik_id, predmet_id)
);

-- Ucenici <-> Predmeti
CREATE TABLE ucenici_predmeti (
    id SERIAL PRIMARY KEY,
    ucenik_id INT NOT NULL REFERENCES korisnici(id),
    predmet_id INT NOT NULL REFERENCES predmeti(id),
    UNIQUE(ucenik_id, predmet_id)
);

-- Ocene
CREATE TABLE ocene (
    id SERIAL PRIMARY KEY,
    ucenik_id INT NOT NULL REFERENCES korisnici(id),
    predmet_id INT NOT NULL REFERENCES predmeti(id),
    nastavnik_id INT NOT NULL REFERENCES korisnici(id),
    ocena SMALLINT NOT NULL CHECK (ocena BETWEEN 1 AND 5),
    tromesecje SMALLINT NOT NULL CHECK (tromesecje BETWEEN 1 AND 4),
    komentar TEXT,
    unesena_u TIMESTAMP DEFAULT NOW()
);

-- Zakljucne ocene
CREATE TABLE zakljucne_ocene (
    id SERIAL PRIMARY KEY,
    ucenik_id INT NOT NULL REFERENCES korisnici(id),
    predmet_id INT NOT NULL REFERENCES predmeti(id),
    nastavnik_id INT NOT NULL REFERENCES korisnici(id),
    ocena SMALLINT NOT NULL CHECK (ocena BETWEEN 1 AND 5),
    predlozena_ocena SMALLINT NOT NULL,
    obrazlozenje TEXT,
    unesena_u TIMESTAMP DEFAULT NOW(),
    UNIQUE(ucenik_id, predmet_id)
);

-- Zahtevi za brisanje
CREATE TABLE zahtevi_za_brisanje (
    id SERIAL PRIMARY KEY,
    ocena_id INT NOT NULL REFERENCES ocene(id),
    nastavnik_id INT NOT NULL REFERENCES korisnici(id),
    razlog TEXT NOT NULL,
    status status_tip DEFAULT 'na_cekanju',
    admin_komentar TEXT,
    kreiran_u TIMESTAMP DEFAULT NOW(),
    obradjen_u TIMESTAMP
);

-- ============================================================
-- TRIGERI
-- ============================================================

CREATE OR REPLACE FUNCTION proveri_ocenu()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM ucenici_predmeti
        WHERE ucenik_id = NEW.ucenik_id AND predmet_id = NEW.predmet_id
    ) THEN
        RAISE EXCEPTION 'Učenik ne prati ovaj predmet.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM nastavnici_predmeti
        WHERE nastavnik_id = NEW.nastavnik_id AND predmet_id = NEW.predmet_id
    ) THEN
        RAISE EXCEPTION 'Nastavnik ne predaje ovaj predmet.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pre_unosa_ocene
BEFORE INSERT ON ocene
FOR EACH ROW EXECUTE FUNCTION proveri_ocenu();

-- ============================================================
-- DEMO PODACI
-- lozinka za sve: "lozinka123"
-- ============================================================

INSERT INTO korisnici (korisnicko_ime, lozinka_hash, uloga, ime, prezime, email) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'admin', 'Glavni', 'Administrator', 'admin@skola.rs'),
('petar.petrovic', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'nastavnik', 'Petar', 'Petrović', 'petar@skola.rs'),
('marija.markovic', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'nastavnik', 'Marija', 'Marković', 'marija@skola.rs'),
('jovan.jovanovic', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'ucenik', 'Jovan', 'Jovanović', 'jovan@ucenik.rs'),
('ana.anic', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'ucenik', 'Ana', 'Anić', 'ana@ucenik.rs'),
('nikola.nikolic', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'ucenik', 'Nikola', 'Nikolić', 'nikola@ucenik.rs');

INSERT INTO predmeti (naziv, opis) VALUES
('Matematika', 'Osnovna matematika za srednju školu'),
('Srpski jezik', 'Srpski jezik i književnost'),
('Fizika', 'Osnove fizike'),
('Istorija', 'Istorija Srbije i sveta'),
('Engleski jezik', 'Engleski jezik - nivo B2');

INSERT INTO nastavnici_predmeti (nastavnik_id, predmet_id) VALUES
(2, 1), (2, 3), (3, 2), (3, 4), (3, 5);

INSERT INTO ucenici_predmeti (ucenik_id, predmet_id) VALUES
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5),
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5),
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5);

INSERT INTO ocene (ucenik_id, predmet_id, nastavnik_id, ocena, tromesecje, komentar) VALUES
(4, 1, 2, 4, 1, 'Dobar rad na testu'),
(4, 1, 2, 5, 1, 'Odličan odgovor'),
(4, 1, 2, 3, 2, 'Može bolje'),
(4, 2, 3, 4, 1, 'Dobar esej'),
(5, 1, 2, 5, 1, 'Odlično'),
(5, 1, 2, 5, 2, 'Odlično i dalje'),
(6, 1, 2, 2, 1, 'Treba više truda'),
(6, 3, 2, 3, 1, 'Prosečan rad');
