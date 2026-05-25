import { Router, Request, Response } from 'express';
import pool from '../db/connection';
import { zahtevajUlogu } from '../middleware/auth';

const router = Router();

// Učenik vidi svoje ocene
router.get('/moje', zahtevajUlogu('ucenik'), async (req: Request, res: Response): Promise<void> => {
  const ucenikId = req.session.korisnik!.id;
  try {
    const ocene = await pool.query(
      `SELECT o.*, p.naziv AS predmet_naziv,
              k.ime AS nastavnik_ime, k.prezime AS nastavnik_prezime
       FROM ocene o
       JOIN predmeti p ON p.id = o.predmet_id
       JOIN korisnici k ON k.id = o.nastavnik_id
       WHERE o.ucenik_id = $1
       ORDER BY o.tromesecje, p.naziv, o.unesena_u`,
      [ucenikId]
    );

    const zakljucne = await pool.query(
      `SELECT zo.*, p.naziv AS predmet_naziv
       FROM zakljucne_ocene zo
       JOIN predmeti p ON p.id = zo.predmet_id
       WHERE zo.ucenik_id = $1`,
      [ucenikId]
    );

    res.json({ ocene: ocene.rows, zakljucne: zakljucne.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// Nastavnik vidi ocene učenika
router.get('/ucenik/:id', zahtevajUlogu('nastavnik', 'admin'), async (req: Request, res: Response): Promise<void> => {
  const ucenikId = parseInt(req.params.id);
  const nastavnikId = req.session.korisnik!.id;
  const jeAdmin = req.session.korisnik!.uloga === 'admin';

  if (isNaN(ucenikId)) {
    res.status(400).json({ greska: 'Neispravni ID.' });
    return;
  }

  try {
    let queryText = `SELECT o.*, p.naziv AS predmet_naziv,
                            k.ime AS nastavnik_ime, k.prezime AS nastavnik_prezime
                     FROM ocene o
                     JOIN predmeti p ON p.id = o.predmet_id
                     JOIN korisnici k ON k.id = o.nastavnik_id
                     WHERE o.ucenik_id = $1`;
    const params: number[] = [ucenikId];

    if (!jeAdmin) {
      queryText += ' AND o.nastavnik_id = $2';
      params.push(nastavnikId);
    }

    queryText += ' ORDER BY o.tromesecje, p.naziv, o.unesena_u';
    const result = await pool.query(queryText, params);
    res.json({ ocene: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// Nastavnikovi učenici
router.get('/moji-ucenici', zahtevajUlogu('nastavnik'), async (req: Request, res: Response): Promise<void> => {
  const nastavnikId = req.session.korisnik!.id;
  try {
    const result = await pool.query(
      `SELECT DISTINCT k.id, k.ime, k.prezime, k.korisnicko_ime
       FROM korisnici k
       JOIN ucenici_predmeti up ON up.ucenik_id = k.id
       JOIN nastavnici_predmeti np ON np.predmet_id = up.predmet_id
       WHERE np.nastavnik_id = $1
       ORDER BY k.prezime, k.ime`,
      [nastavnikId]
    );
    res.json({ ucenici: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// Nastavnikovi predmeti
router.get('/moji-predmeti', zahtevajUlogu('nastavnik'), async (req: Request, res: Response): Promise<void> => {
  const nastavnikId = req.session.korisnik!.id;
  try {
    const result = await pool.query(
      `SELECT p.* FROM predmeti p
       JOIN nastavnici_predmeti np ON np.predmet_id = p.id
       WHERE np.nastavnik_id = $1`,
      [nastavnikId]
    );
    res.json({ predmeti: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// Unos ocene
router.post('/', zahtevajUlogu('nastavnik'), async (req: Request, res: Response): Promise<void> => {
  const { ucenik_id, predmet_id, ocena, tromesecje, komentar } = req.body;
  const nastavnikId = req.session.korisnik!.id;

  if (!ucenik_id || !predmet_id || !ocena || !tromesecje) {
    res.status(400).json({ greska: 'Sva obavezna polja moraju biti popunjena.' });
    return;
  }

  const ocenaNum = parseInt(ocena);
  const tromesecjeNum = parseInt(tromesecje);

  if (isNaN(ocenaNum) || ocenaNum < 1 || ocenaNum > 5) {
    res.status(400).json({ greska: 'Ocena mora biti između 1 i 5.' });
    return;
  }
  if (isNaN(tromesecjeNum) || tromesecjeNum < 1 || tromesecjeNum > 4) {
    res.status(400).json({ greska: 'Tromesečje mora biti između 1 i 4.' });
    return;
  }

  try {
    const np = await pool.query(
      'SELECT id FROM nastavnici_predmeti WHERE nastavnik_id = $1 AND predmet_id = $2',
      [nastavnikId, predmet_id]
    );
    if (np.rows.length === 0) {
      res.status(403).json({ greska: 'Ne predajete ovaj predmet.' });
      return;
    }

    const up = await pool.query(
      'SELECT id FROM ucenici_predmeti WHERE ucenik_id = $1 AND predmet_id = $2',
      [ucenik_id, predmet_id]
    );
    if (up.rows.length === 0) {
      res.status(403).json({ greska: 'Ovaj učenik ne prati navedeni predmet.' });
      return;
    }

    const result = await pool.query(
      'INSERT INTO ocene (ucenik_id, predmet_id, nastavnik_id, ocena, tromesecje, komentar) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [ucenik_id, predmet_id, nastavnikId, ocenaNum, tromesecjeNum, komentar || null]
    );

    res.status(201).json({ poruka: 'Ocena uspešno upisana.', id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// Prosek i predlog zaključne
router.get('/prosek/:ucenikId/:predmetId', zahtevajUlogu('nastavnik', 'admin'), async (req: Request, res: Response): Promise<void> => {
  const ucenikId = parseInt(req.params.ucenikId);
  const predmetId = parseInt(req.params.predmetId);

  if (isNaN(ucenikId) || isNaN(predmetId)) {
    res.status(400).json({ greska: 'Neispravni parametri.' });
    return;
  }

  try {
    const poTromesecjima = await pool.query(
      `SELECT tromesecje,
              ROUND(AVG(ocena)::numeric, 2) AS prosek,
              COUNT(*) AS broj_ocena
       FROM ocene
       WHERE ucenik_id = $1 AND predmet_id = $2
       GROUP BY tromesecje
       ORDER BY tromesecje`,
      [ucenikId, predmetId]
    );

    const ukupno = await pool.query(
      'SELECT ROUND(AVG(ocena)::numeric, 2) AS ukupni_prosek FROM ocene WHERE ucenik_id = $1 AND predmet_id = $2',
      [ucenikId, predmetId]
    );

    const prosek = parseFloat(ukupno.rows[0]?.ukupni_prosek || '0');
    const predlozena = Math.round(prosek);

    res.json({
      po_tromesecjima: poTromesecjima.rows,
      ukupni_prosek: prosek,
      predlozena_zakljucna_ocena: predlozena
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// Zaključivanje ocene
router.post('/zakljuci', zahtevajUlogu('nastavnik'), async (req: Request, res: Response): Promise<void> => {
  const { ucenik_id, predmet_id, ocena, obrazlozenje } = req.body;
  const nastavnikId = req.session.korisnik!.id;

  if (!ucenik_id || !predmet_id || !ocena) {
    res.status(400).json({ greska: 'Obavezni podaci nedostaju.' });
    return;
  }

  const ocenaNum = parseInt(ocena);
  if (isNaN(ocenaNum) || ocenaNum < 1 || ocenaNum > 5) {
    res.status(400).json({ greska: 'Ocena mora biti između 1 i 5.' });
    return;
  }

  try {
    const ukupno = await pool.query(
      'SELECT ROUND(AVG(ocena)::numeric, 0) AS predlog FROM ocene WHERE ucenik_id = $1 AND predmet_id = $2',
      [ucenik_id, predmet_id]
    );
    const predlozena = Math.round(parseFloat(ukupno.rows[0]?.predlog || String(ocenaNum)));

    if (ocenaNum > predlozena && !obrazlozenje) {
      res.status(400).json({ greska: 'Obrazloženje je obavezno kada je ocena veća od predložene.' });
      return;
    }

    await pool.query(
      `INSERT INTO zakljucne_ocene (ucenik_id, predmet_id, nastavnik_id, ocena, predlozena_ocena, obrazlozenje)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (ucenik_id, predmet_id)
       DO UPDATE SET ocena=$4, predlozena_ocena=$5, obrazlozenje=$6, nastavnik_id=$3, unesena_u=NOW()`,
      [ucenik_id, predmet_id, nastavnikId, ocenaNum, predlozena, obrazlozenje || null]
    );

    res.json({ poruka: 'Zaključna ocena uspešno upisana.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// Zahtev za brisanje
router.post('/zahtev-brisanje', zahtevajUlogu('nastavnik'), async (req: Request, res: Response): Promise<void> => {
  const { ocena_id, razlog } = req.body;
  const nastavnikId = req.session.korisnik!.id;

  if (!ocena_id || !razlog || razlog.trim().length < 10) {
    res.status(400).json({ greska: 'ID ocene i razlog (min. 10 karaktera) su obavezni.' });
    return;
  }

  try {
    const ocenaCheck = await pool.query(
      'SELECT id FROM ocene WHERE id = $1 AND nastavnik_id = $2',
      [ocena_id, nastavnikId]
    );
    if (ocenaCheck.rows.length === 0) {
      res.status(403).json({ greska: 'Ova ocena ne pripada vama.' });
      return;
    }

    const postojeci = await pool.query(
      "SELECT id FROM zahtevi_za_brisanje WHERE ocena_id = $1 AND status = 'na_cekanju'",
      [ocena_id]
    );
    if (postojeci.rows.length > 0) {
      res.status(409).json({ greska: 'Već postoji aktivan zahtev za ovu ocenu.' });
      return;
    }

    await pool.query(
      'INSERT INTO zahtevi_za_brisanje (ocena_id, nastavnik_id, razlog) VALUES ($1,$2,$3)',
      [ocena_id, nastavnikId, razlog.trim()]
    );

    res.status(201).json({ poruka: 'Zahtev je poslat adminu.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// Admin - svi zahtevi
router.get('/zahtevi-brisanje', zahtevajUlogu('admin'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT zb.*,
              o.ocena, o.tromesecje,
              p.naziv AS predmet_naziv,
              ku.ime AS ucenik_ime, ku.prezime AS ucenik_prezime,
              kn.ime AS nastavnik_ime, kn.prezime AS nastavnik_prezime
       FROM zahtevi_za_brisanje zb
       JOIN ocene o ON o.id = zb.ocena_id
       JOIN predmeti p ON p.id = o.predmet_id
       JOIN korisnici ku ON ku.id = o.ucenik_id
       JOIN korisnici kn ON kn.id = zb.nastavnik_id
       ORDER BY zb.kreiran_u DESC`
    );
    res.json({ zahtevi: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// Admin - obrada zahteva
router.post('/zahtevi-brisanje/:id/obradi', zahtevajUlogu('admin'), async (req: Request, res: Response): Promise<void> => {
  const zahtevId = parseInt(req.params.id);
  const { akcija, admin_komentar } = req.body;

  if (!['odobren', 'odbijen'].includes(akcija) || isNaN(zahtevId)) {
    res.status(400).json({ greska: 'Neispravni podaci.' });
    return;
  }

  try {
    const zahtevRes = await pool.query(
      "SELECT * FROM zahtevi_za_brisanje WHERE id = $1 AND status = 'na_cekanju'",
      [zahtevId]
    );
    if (zahtevRes.rows.length === 0) {
      res.status(404).json({ greska: 'Zahtev nije pronađen ili je već obrađen.' });
      return;
    }

    const zahtev = zahtevRes.rows[0];

    if (akcija === 'odobren') {
      await pool.query('DELETE FROM ocene WHERE id = $1', [zahtev.ocena_id]);
    }

    await pool.query(
      'UPDATE zahtevi_za_brisanje SET status = $1, admin_komentar = $2, obradjen_u = NOW() WHERE id = $3',
      [akcija, admin_komentar || null, zahtevId]
    );

    res.json({ poruka: akcija === 'odobren' ? 'Ocena je obrisana.' : 'Zahtev je odbijen.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

export default router;
