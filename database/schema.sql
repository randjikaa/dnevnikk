-- ============================================================
-- Elektronski dnevnik srednje škole
-- SQL Schema + inicijalni podaci
-- ============================================================

CREATE DATABASE IF NOT EXISTS ednevnik CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ednevnik;

-- ============================================================
-- TABELE
-- ============================================================

CREATE TABLE korisnici (
    id INT AUTO_INCREMENT PRIMARY KEY,
    korisnicko_ime VARCHAR(50) NOT NULL UNIQUE,
    lozinka_hash VARCHAR(255) NOT NULL,
    uloga ENUM('ucenik', 'nastavnik', 'admin') NOT NULL,
    ime VARCHAR(100) NOT NULL,
    prezime VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    kreiran_u TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE predmeti (
    id INT AUTO_INCREMENT PRIMARY KEY,
    naziv VARCHAR(100) NOT NULL,
    opis TEXT
);

CREATE TABLE nastavnici_predmeti (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nastavnik_id INT NOT NULL,
    predmet_id INT NOT NULL,
    FOREIGN KEY (nastavnik_id) REFERENCES korisnici(id),
    FOREIGN KEY (predmet_id) REFERENCES predmeti(id),
    UNIQUE KEY (nastavnik_id, predmet_id)
);

CREATE TABLE ucenici_predmeti (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ucenik_id INT NOT NULL,
    predmet_id INT NOT NULL,
    FOREIGN KEY (ucenik_id) REFERENCES korisnici(id),
    FOREIGN KEY (predmet_id) REFERENCES predmeti(id),
    UNIQUE KEY (ucenik_id, predmet_id)
);

CREATE TABLE ocene (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ucenik_id INT NOT NULL,
    predmet_id INT NOT NULL,
    nastavnik_id INT NOT NULL,
    ocena TINYINT NOT NULL CHECK (ocena BETWEEN 1 AND 5),
    tromesecje TINYINT NOT NULL CHECK (tromesecje BETWEEN 1 AND 4),
    komentar TEXT,
    unesena_u TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ucenik_id) REFERENCES korisnici(id),
    FOREIGN KEY (predmet_id) REFERENCES predmeti(id),
    FOREIGN KEY (nastavnik_id) REFERENCES korisnici(id)
);

CREATE TABLE zakljucne_ocene (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ucenik_id INT NOT NULL,
    predmet_id INT NOT NULL,
    nastavnik_id INT NOT NULL,
    ocena TINYINT NOT NULL CHECK (ocena BETWEEN 1 AND 5),
    predlozena_ocena TINYINT NOT NULL,
    obrazlozenje TEXT,
    unesena_u TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ucenik_id) REFERENCES korisnici(id),
    FOREIGN KEY (predmet_id) REFERENCES predmeti(id),
    FOREIGN KEY (nastavnik_id) REFERENCES korisnici(id),
    UNIQUE KEY (ucenik_id, predmet_id)
);

CREATE TABLE zahtevi_za_brisanje (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ocena_id INT NOT NULL,
    nastavnik_id INT NOT NULL,
    razlog TEXT NOT NULL,
    status ENUM('na_cekanju', 'odobren', 'odbijen') DEFAULT 'na_cekanju',
    admin_komentar TEXT,
    kreiran_u TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    obradjen_u TIMESTAMP NULL,
    FOREIGN KEY (ocena_id) REFERENCES ocene(id),
    FOREIGN KEY (nastavnik_id) REFERENCES korisnici(id)
);

-- ============================================================
-- TRIGERI - validacija na nivou baze
-- ============================================================

DELIMITER $$

-- Sprečava unos ocene za učenika koji ne prati predmet
CREATE TRIGGER pre_unosa_ocene
BEFORE INSERT ON ocene
FOR EACH ROW
BEGIN
    DECLARE ucenik_prati INT;
    DECLARE nastavnik_predaje INT;

    SELECT COUNT(*) INTO ucenik_prati
    FROM ucenici_predmeti
    WHERE ucenik_id = NEW.ucenik_id AND predmet_id = NEW.predmet_id;

    SELECT COUNT(*) INTO nastavnik_predaje
    FROM nastavnici_predmeti
    WHERE nastavnik_id = NEW.nastavnik_id AND predmet_id = NEW.predmet_id;

    IF ucenik_prati = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Učenik ne prati ovaj predmet.';
    END IF;

    IF nastavnik_predaje = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nastavnik ne predaje ovaj predmet.';
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- INICIJALNI PODACI (demo)
-- lozinka za sve: "lozinka123" (bcrypt hash)
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

-- Nastavnici predaju predmete
INSERT INTO nastavnici_predmeti (nastavnik_id, predmet_id) VALUES
(2, 1), -- Petar predaje Matematiku
(2, 3), -- Petar predaje Fiziku
(3, 2), -- Marija predaje Srpski
(3, 4), -- Marija predaje Istoriju
(3, 5); -- Marija predaje Engleski

-- Učenici prate predmete
INSERT INTO ucenici_predmeti (ucenik_id, predmet_id) VALUES
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), -- Jovan prati sve
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), -- Ana prati sve
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5); -- Nikola prati sve

-- Demo ocene
INSERT INTO ocene (ucenik_id, predmet_id, nastavnik_id, ocena, tromesecje, komentar) VALUES
(4, 1, 2, 4, 1, 'Dobar rad na testu'),
(4, 1, 2, 5, 1, 'Odličan odgovor'),
(4, 1, 2, 3, 2, 'Može bolje'),
(4, 2, 3, 4, 1, 'Dobar esej'),
(5, 1, 2, 5, 1, 'Odlično'),
(5, 1, 2, 5, 2, 'Odlično i dalje'),
(6, 1, 2, 2, 1, 'Treba više truda'),
(6, 3, 2, 3, 1, 'Prosečan rad');
