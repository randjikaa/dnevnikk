import { Router, Request, Response } from 'express';
import pool from '../db/connection';
import { zahtevajUlogu } from '../middleware/auth';

const router = Router();

router.get('/ucenici', zahtevajUlogu('admin'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT k.id, k.ime, k.prezime, k.korisnicko_ime, k.email,
              STRING_AGG(p.naziv, ', ' ORDER BY p.naziv) AS predmeti
       FROM korisnici k
       LEFT JOIN ucenici_predmeti up ON up.ucenik_id = k.id
       LEFT JOIN predmeti p ON p.id = up.predmet_id
       WHERE k.uloga = 'ucenik'
       GROUP BY k.id`
    );
    res.json({ ucenici: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

router.get('/nastavnici', zahtevajUlogu('admin'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT k.id, k.ime, k.prezime, k.korisnicko_ime, k.email,
              STRING_AGG(p.naziv, ', ' ORDER BY p.naziv) AS predmeti
       FROM korisnici k
       LEFT JOIN nastavnici_predmeti np ON np.nastavnik_id = k.id
       LEFT JOIN predmeti p ON p.id = np.predmet_id
       WHERE k.uloga = 'nastavnik'
       GROUP BY k.id`
    );
    res.json({ nastavnici: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

export default router;
