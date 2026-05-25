import { Router, Request, Response } from 'express';
import pool from '../db/connection';
import { zahtevajUlogu } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = Router();

// GET /api/admin/ucenici
router.get('/ucenici', zahtevajUlogu('admin'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const [ucenici] = await pool.execute<RowDataPacket[]>(
      `SELECT k.id, k.ime, k.prezime, k.korisnicko_ime, k.email,
              GROUP_CONCAT(p.naziv ORDER BY p.naziv SEPARATOR ', ') AS predmeti
       FROM korisnici k
       LEFT JOIN ucenici_predmeti up ON up.ucenik_id = k.id
       LEFT JOIN predmeti p ON p.id = up.predmet_id
       WHERE k.uloga = 'ucenik'
       GROUP BY k.id`
    );
    res.json({ ucenici });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// GET /api/admin/nastavnici
router.get('/nastavnici', zahtevajUlogu('admin'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const [nastavnici] = await pool.execute<RowDataPacket[]>(
      `SELECT k.id, k.ime, k.prezime, k.korisnicko_ime, k.email,
              GROUP_CONCAT(p.naziv ORDER BY p.naziv SEPARATOR ', ') AS predmeti
       FROM korisnici k
       LEFT JOIN nastavnici_predmeti np ON np.nastavnik_id = k.id
       LEFT JOIN predmeti p ON p.id = np.predmet_id
       WHERE k.uloga = 'nastavnik'
       GROUP BY k.id`
    );
    res.json({ nastavnici });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

export default router;
