import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db/connection';
import { zahtevajPrijavu } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = Router();

// POST /api/auth/prijava
router.post('/prijava', async (req: Request, res: Response): Promise<void> => {
  const { korisnicko_ime, lozinka } = req.body;

  // Validacija
  if (!korisnicko_ime || !lozinka) {
    res.status(400).json({ greska: 'Korisničko ime i lozinka su obavezni.' });
    return;
  }

  if (typeof korisnicko_ime !== 'string' || typeof lozinka !== 'string') {
    res.status(400).json({ greska: 'Neispravni podaci.' });
    return;
  }

  if (korisnicko_ime.length < 3 || korisnicko_ime.length > 50) {
    res.status(400).json({ greska: 'Neispravno korisničko ime.' });
    return;
  }

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM korisnici WHERE korisnicko_ime = ?',
      [korisnicko_ime.trim()]
    );

    if (rows.length === 0) {
      res.status(401).json({ greska: 'Pogrešno korisničko ime ili lozinka.' });
      return;
    }

    const korisnik = rows[0];
    const ispravnaLozinka = await bcrypt.compare(lozinka, korisnik.lozinka_hash);

    if (!ispravnaLozinka) {
      res.status(401).json({ greska: 'Pogrešno korisničko ime ili lozinka.' });
      return;
    }

    req.session.korisnik = {
      id: korisnik.id,
      korisnicko_ime: korisnik.korisnicko_ime,
      uloga: korisnik.uloga,
      ime: korisnik.ime,
      prezime: korisnik.prezime,
      email: korisnik.email
    };

    res.json({
      poruka: 'Uspešna prijava.',
      korisnik: req.session.korisnik
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// POST /api/auth/odjava
router.post('/odjava', zahtevajPrijavu, (req: Request, res: Response): void => {
  req.session.destroy(() => {
    res.json({ poruka: 'Uspešna odjava.' });
  });
});

// GET /api/auth/ja
router.get('/ja', zahtevajPrijavu, (req: Request, res: Response): void => {
  res.json({ korisnik: req.session.korisnik });
});

export default router;
