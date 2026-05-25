import { Router, Request, Response } from 'express';
import pool from '../db/connection';
import { zahtevajUlogu, zahtevajPrijavu } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// GET /api/ocene/moje - učenik vidi svoje ocene
router.get('/moje', zahtevajUlogu('ucenik'), async (req: Request, res: Response): Promise<void> => {
  const ucenikId = req.session.korisnik!.id;
  try {
    const [ocene] = await pool.execute<RowDataPacket[]>(
      `SELECT o.*, p.naziv AS predmet_naziv,
              k.ime AS nastavnik_ime, k.prezime AS nastavnik_prezime
       FROM ocene o
       JOIN predmeti p ON p.id = o.predmet_id
       JOIN korisnici k ON k.id = o.nastavnik_id
       WHERE o.ucenik_id = ?
       ORDER BY o.tromesecje, p.naziv, o.unesena_u`,
      [ucenikId]
    );

    const [zakljucne] = await pool.execute<RowDataPacket[]>(
      `SELECT zo.*, p.naziv AS predmet_naziv
       FROM zakljucne_ocene zo
       JOIN predmeti p ON p.id = zo.predmet_id
       WHERE zo.ucenik_id = ?`,
      [ucenikId]
    );

    res.json({ ocene, zakljucne });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// GET /api/ocene/ucenik/:id - nastavnik vidi ocene učenika za svoje predmete
router.get('/ucenik/:id', zahtevajUlogu('nastavnik', 'admin'), async (req: Request, res: Response): Promise<void> => {
  const ucenikId = parseInt(req.params.id);
  const nastavnikId = req.session.korisnik!.id;
  const jeAdmin = req.session.korisnik!.uloga === 'admin';

  if (isNaN(ucenikId)) {
    res.status(400).json({ greska: 'Neispravni ID učenika.' });
    return;
  }

  try {
    let query = `SELECT o.*, p.naziv AS predmet_naziv,
                        k.ime AS nastavnik_ime, k.prezime AS nastavnik_prezime
                 FROM ocene o
                 JOIN predmeti p ON p.id = o.predmet_id
                 JOIN korisnici k ON k.id = o.nastavnik_id
                 WHERE o.ucenik_id = ?`;
    const params: number[] = [ucenikId];

    if (!jeAdmin) {
      query += ' AND o.nastavnik_id = ?';
      params.push(nastavnikId);
    }

    query += ' ORDER BY o.tromesecje, p.naziv, o.unesena_u';

    const [ocene] = await pool.execute<RowDataPacket[]>(query, params);
    res.json({ ocene });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// GET /api/ocene/moji-ucenici - nastavnik vidi listu učenika
router.get('/moji-ucenici', zahtevajUlogu('nastavnik'), async (req: Request, res: Response): Promise<void> => {
  const nastavnikId = req.session.korisnik!.id;
  try {
    const [ucenici] = await pool.execute<RowDataPacket[]>(
      `SELECT DISTINCT k.id, k.ime, k.prezime, k.korisnicko_ime
       FROM korisnici k
       JOIN ucenici_predmeti up ON up.ucenik_id = k.id
       JOIN nastavnici_predmeti np ON np.predmet_id = up.predmet_id
       WHERE np.nastavnik_id = ?
       ORDER BY k.prezime, k.ime`,
      [nastavnikId]
    );
    res.json({ ucenici });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// GET /api/ocene/moji-predmeti - nastavnik vidi svoje predmete
router.get('/moji-predmeti', zahtevajUlogu('nastavnik'), async (req: Request, res: Response): Promise<void> => {
  const nastavnikId = req.session.korisnik!.id;
  try {
    const [predmeti] = await pool.execute<RowDataPacket[]>(
      `SELECT p.* FROM predmeti p
       JOIN nastavnici_predmeti np ON np.predmet_id = p.id
       WHERE np.nastavnik_id = ?`,
      [nastavnikId]
    );
    res.json({ predmeti });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// POST /api/ocene - nastavnik upisuje ocenu
router.post('/', zahtevajUlogu('nastavnik'), async (req: Request, res: Response): Promise<void> => {
  const { ucenik_id, predmet_id, ocena, tromesecje, komentar } = req.body;
  const nastavnikId = req.session.korisnik!.id;

  // Validacija
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
    // Provera: nastavnik predaje ovaj predmet
    const [npRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM nastavnici_predmeti WHERE nastavnik_id = ? AND predmet_id = ?',
      [nastavnikId, predmet_id]
    );
    if (npRows.length === 0) {
      res.status(403).json({ greska: 'Ne predajete ovaj predmet.' });
      return;
    }

    // Provera: učenik prati ovaj predmet
    const [upRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM ucenici_predmeti WHERE ucenik_id = ? AND predmet_id = ?',
      [ucenik_id, predmet_id]
    );
    if (upRows.length === 0) {
      res.status(403).json({ greska: 'Ovaj učenik ne prati navedeni predmet.' });
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO ocene (ucenik_id, predmet_id, nastavnik_id, ocena, tromesecje, komentar) VALUES (?, ?, ?, ?, ?, ?)',
      [ucenik_id, predmet_id, nastavnikId, ocenaNum, tromesecjeNum, komentar || null]
    );

    res.status(201).json({ poruka: 'Ocena uspešno upisana.', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// GET /api/ocene/prosek/:ucenikId/:predmetId - prosek po tromesečjima
router.get('/prosek/:ucenikId/:predmetId', zahtevajUlogu('nastavnik', 'admin'), async (req: Request, res: Response): Promise<void> => {
  const ucenikId = parseInt(req.params.ucenikId);
  const predmetId = parseInt(req.params.predmetId);

  if (isNaN(ucenikId) || isNaN(predmetId)) {
    res.status(400).json({ greska: 'Neispravni parametri.' });
    return;
  }

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT tromesecje,
              ROUND(AVG(ocena), 2) AS prosek,
              COUNT(*) AS broj_ocena
       FROM ocene
       WHERE ucenik_id = ? AND predmet_id = ?
       GROUP BY tromesecje
       ORDER BY tromesecje`,
      [ucenikId, predmetId]
    );

    // Izračunaj ukupni prosek i predloži zaključnu ocenu
    const [ukupno] = await pool.execute<RowDataPacket[]>(
      'SELECT ROUND(AVG(ocena), 2) AS ukupni_prosek FROM ocene WHERE ucenik_id = ? AND predmet_id = ?',
      [ucenikId, predmetId]
    );

    const prosek = ukupno[0]?.ukupni_prosek || 0;
    const predlozenaOcena = Math.round(prosek);

    res.json({
      po_tromesecjima: rows,
      ukupni_prosek: prosek,
      predlozena_zakljucna_ocena: predlozenaOcena
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// POST /api/ocene/zakljuci - nastavnik zaključuje ocenu
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
    // Izračunaj predloženu ocenu
    const [ukupno] = await pool.execute<RowDataPacket[]>(
      'SELECT ROUND(AVG(ocena), 0) AS predlog FROM ocene WHERE ucenik_id = ? AND predmet_id = ?',
      [ucenik_id, predmet_id]
    );

    const predlozena = Math.round(ukupno[0]?.predlog || ocenaNum);

    // Ako je ocena veća od predložene, obrazloženje je obavezno
    if (ocenaNum > predlozena && !obrazlozenje) {
      res.status(400).json({ greska: 'Obrazloženje je obavezno kada je ocena veća od predložene.' });
      return;
    }

    await pool.execute(
      `INSERT INTO zakljucne_ocene (ucenik_id, predmet_id, nastavnik_id, ocena, predlozena_ocena, obrazlozenje)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         ocena = VALUES(ocena),
         predlozena_ocena = VALUES(predlozena_ocena),
         obrazlozenje = VALUES(obrazlozenje),
         nastavnik_id = VALUES(nastavnik_id),
         unesena_u = CURRENT_TIMESTAMP`,
      [ucenik_id, predmet_id, nastavnikId, ocenaNum, predlozena, obrazlozenje || null]
    );

    res.json({ poruka: 'Zaključna ocena uspešno upisana.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// POST /api/ocene/zahtev-brisanje - nastavnik traži brisanje ocene
router.post('/zahtev-brisanje', zahtevajUlogu('nastavnik'), async (req: Request, res: Response): Promise<void> => {
  const { ocena_id, razlog } = req.body;
  const nastavnikId = req.session.korisnik!.id;

  if (!ocena_id || !razlog) {
    res.status(400).json({ greska: 'ID ocene i razlog su obavezni.' });
    return;
  }

  if (typeof razlog !== 'string' || razlog.trim().length < 10) {
    res.status(400).json({ greska: 'Razlog mora biti najmanje 10 karaktera.' });
    return;
  }

  try {
    // Proveri da li ocena pripada nastavniku
    const [ocenaRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM ocene WHERE id = ? AND nastavnik_id = ?',
      [ocena_id, nastavnikId]
    );

    if (ocenaRows.length === 0) {
      res.status(403).json({ greska: 'Ova ocena ne pripada vama.' });
      return;
    }

    // Proveri da već ne postoji aktivan zahtev
    const [postojeciRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM zahtevi_za_brisanje WHERE ocena_id = ? AND status = ?',
      [ocena_id, 'na_cekanju']
    );

    if (postojeciRows.length > 0) {
      res.status(409).json({ greska: 'Već postoji aktivan zahtev za brisanje ove ocene.' });
      return;
    }

    await pool.execute(
      'INSERT INTO zahtevi_za_brisanje (ocena_id, nastavnik_id, razlog) VALUES (?, ?, ?)',
      [ocena_id, nastavnikId, razlog.trim()]
    );

    res.status(201).json({ poruka: 'Zahtev za brisanje je poslat adminu.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// GET /api/ocene/zahtevi-brisanje - admin vidi sve zahteve
router.get('/zahtevi-brisanje', zahtevajUlogu('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const [zahtevi] = await pool.execute<RowDataPacket[]>(
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
    res.json({ zahtevi });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

// POST /api/ocene/zahtevi-brisanje/:id/obradi - admin odobrava/odbija
router.post('/zahtevi-brisanje/:id/obradi', zahtevajUlogu('admin'), async (req: Request, res: Response): Promise<void> => {
  const zahtevId = parseInt(req.params.id);
  const { akcija, admin_komentar } = req.body;

  if (!['odobren', 'odbijen'].includes(akcija)) {
    res.status(400).json({ greska: 'Akcija mora biti "odobren" ili "odbijen".' });
    return;
  }

  if (isNaN(zahtevId)) {
    res.status(400).json({ greska: 'Neispravni ID zahteva.' });
    return;
  }

  try {
    const [zahtevRows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM zahtevi_za_brisanje WHERE id = ? AND status = ?',
      [zahtevId, 'na_cekanju']
    );

    if (zahtevRows.length === 0) {
      res.status(404).json({ greska: 'Zahtev nije pronađen ili je već obrađen.' });
      return;
    }

    const zahtev = zahtevRows[0];

    if (akcija === 'odobren') {
      // Briši ocenu
      await pool.execute('DELETE FROM ocene WHERE id = ?', [zahtev.ocena_id]);
    }

    await pool.execute(
      'UPDATE zahtevi_za_brisanje SET status = ?, admin_komentar = ?, obradjen_u = NOW() WHERE id = ?',
      [akcija, admin_komentar || null, zahtevId]
    );

    res.json({ poruka: `Zahtev je ${akcija === 'odobren' ? 'odobren i ocena je obrisana' : 'odbijen'}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ greska: 'Greška na serveru.' });
  }
});

export default router;
