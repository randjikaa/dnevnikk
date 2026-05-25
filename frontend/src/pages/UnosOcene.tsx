import React, { useEffect, useState, FormEvent } from 'react';
import api, { Predmet, Ucenik } from '../services/api';

type Korak = 'forma' | 'potvrda1' | 'potvrda2' | 'uspeh';

export default function UnosOcene() {
  const [ucenici, setUcenici] = useState<Ucenik[]>([]);
  const [predmeti, setPredmeti] = useState<Predmet[]>([]);
  const [korak, setKorak] = useState<Korak>('forma');
  const [greska, setGreska] = useState('');
  const [ucitavanje, setUcitavanje] = useState(false);

  const [forma, setForma] = useState({
    ucenik_id: '',
    predmet_id: '',
    ocena: '',
    tromesecje: '',
    komentar: ''
  });

  useEffect(() => {
    Promise.all([
      api.get('/ocene/moji-ucenici'),
      api.get('/ocene/moji-predmeti')
    ]).then(([u, p]) => {
      setUcenici(u.data.ucenici);
      setPredmeti(p.data.predmeti);
    }).catch(() => setGreska('Greška pri učitavanju podataka.'));
  }, []);

  const odabraniUcenik = ucenici.find(u => u.id === parseInt(forma.ucenik_id));
  const odabraniPredmet = predmeti.find(p => p.id === parseInt(forma.predmet_id));

  const handleFormaSubmit = (e: FormEvent) => {
    e.preventDefault();
    setGreska('');

    if (!forma.ucenik_id || !forma.predmet_id || !forma.ocena || !forma.tromesecje) {
      setGreska('Sva obavezna polja moraju biti popunjena.');
      return;
    }

    const ocenaNum = parseInt(forma.ocena);
    if (isNaN(ocenaNum) || ocenaNum < 1 || ocenaNum > 5) {
      setGreska('Ocena mora biti između 1 i 5.');
      return;
    }

    setKorak('potvrda1');
  };

  const handleKonacniUnos = async () => {
    setUcitavanje(true);
    setGreska('');
    try {
      await api.post('/ocene', {
        ucenik_id: parseInt(forma.ucenik_id),
        predmet_id: parseInt(forma.predmet_id),
        ocena: parseInt(forma.ocena),
        tromesecje: parseInt(forma.tromesecje),
        komentar: forma.komentar || undefined
      });
      setKorak('uspeh');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { greska?: string } } };
      setGreska(error.response?.data?.greska || 'Greška pri unosu ocene.');
      setKorak('forma');
    } finally {
      setUcitavanje(false);
    }
  };

  const resetuj = () => {
    setForma({ ucenik_id: '', predmet_id: '', ocena: '', tromesecje: '', komentar: '' });
    setKorak('forma');
    setGreska('');
  };

  const ocenaBoja: Record<number, string> = {
    1: 'danger', 2: 'danger', 3: 'warning', 4: 'primary', 5: 'success'
  };

  if (korak === 'uspeh') return (
    <div className="text-center py-5">
      <i className="bi bi-check-circle text-success" style={{ fontSize: 64 }}></i>
      <h3 className="mt-3 text-success">Ocena uspešno upisana!</h3>
      <p className="text-muted">
        Ocena <strong>{forma.ocena}</strong> je upisana učeniku{' '}
        <strong>{odabraniUcenik?.ime} {odabraniUcenik?.prezime}</strong>{' '}
        iz predmeta <strong>{odabraniPredmet?.naziv}</strong>.
      </p>
      <button className="btn btn-primary mt-2" onClick={resetuj}>
        <i className="bi bi-plus-circle me-2"></i>Unesi novu ocenu
      </button>
    </div>
  );

  if (korak === 'potvrda2') return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card border-danger shadow">
          <div className="card-header bg-danger text-white">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>FINALNA POTVRDA — Ovo je poslednji korak!</strong>
          </div>
          <div className="card-body text-center">
            <p className="lead">
              Da li ste <strong>APSOLUTNO SIGURNI</strong> da želite da upišete ocenu?
            </p>
            <div className="my-3 p-3 bg-light rounded">
              <div className={`display-4 fw-bold text-${ocenaBoja[parseInt(forma.ocena)] || 'dark'}`}>
                {forma.ocena}
              </div>
              <div className="mt-1">
                <strong>{odabraniUcenik?.ime} {odabraniUcenik?.prezime}</strong><br />
                {odabraniPredmet?.naziv} — {forma.tromesecje}. tromesečje
              </div>
            </div>
            <p className="text-danger small">
              <i className="bi bi-info-circle me-1"></i>
              Ocena se ne može menjati. Možete samo zatražiti brisanje od administratora.
            </p>
            <div className="d-flex gap-2 justify-content-center mt-3">
              <button className="btn btn-outline-secondary" onClick={() => setKorak('forma')}>
                <i className="bi bi-x-circle me-1"></i>Odustani
              </button>
              <button
                className="btn btn-danger"
                onClick={handleKonacniUnos}
                disabled={ucitavanje}
              >
                {ucitavanje
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>Upisujem...</>
                  : <><i className="bi bi-check2-all me-1"></i>DA, UPIŠI OCENU</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (korak === 'potvrda1') return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card border-warning shadow">
          <div className="card-header bg-warning">
            <i className="bi bi-question-circle-fill me-2"></i>
            <strong>Potvrda unosa ocene</strong>
          </div>
          <div className="card-body">
            <p>Proverite podatke pre unosa:</p>
            <table className="table table-bordered">
              <tbody>
                <tr>
                  <th>Učenik</th>
                  <td>{odabraniUcenik?.ime} {odabraniUcenik?.prezime}</td>
                </tr>
                <tr>
                  <th>Predmet</th>
                  <td>{odabraniPredmet?.naziv}</td>
                </tr>
                <tr>
                  <th>Ocena</th>
                  <td>
                    <span className={`badge bg-${ocenaBoja[parseInt(forma.ocena)] || 'dark'} fs-5`}>
                      {forma.ocena}
                    </span>
                  </td>
                </tr>
                <tr>
                  <th>Tromesečje</th>
                  <td>{forma.tromesecje}.</td>
                </tr>
                {forma.komentar && (
                  <tr>
                    <th>Komentar</th>
                    <td>{forma.komentar}</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="d-flex gap-2 justify-content-end">
              <button className="btn btn-outline-secondary" onClick={() => setKorak('forma')}>
                <i className="bi bi-pencil me-1"></i>Izmeni
              </button>
              <button className="btn btn-warning" onClick={() => setKorak('potvrda2')}>
                <i className="bi bi-check me-1"></i>Podaci su tačni
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="row justify-content-center">
      <div className="col-md-7">
        <h2 className="mb-4">
          <i className="bi bi-plus-circle me-2"></i>Unos ocene
        </h2>

        {greska && (
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-circle me-2"></i>{greska}
          </div>
        )}

        <div className="card shadow-sm">
          <div className="card-body">
            <form onSubmit={handleFormaSubmit} noValidate>
              <div className="mb-3">
                <label htmlFor="ucenik" className="form-label fw-semibold">Učenik *</label>
                <select
                  id="ucenik"
                  className="form-select"
                  value={forma.ucenik_id}
                  onChange={e => setForma(f => ({ ...f, ucenik_id: e.target.value }))}
                  required
                >
                  <option value="">— Odaberite učenika —</option>
                  {ucenici.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.prezime} {u.ime} ({u.korisnicko_ime})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="predmet" className="form-label fw-semibold">Predmet *</label>
                <select
                  id="predmet"
                  className="form-select"
                  value={forma.predmet_id}
                  onChange={e => setForma(f => ({ ...f, predmet_id: e.target.value }))}
                  required
                >
                  <option value="">— Odaberite predmet —</option>
                  {predmeti.map(p => (
                    <option key={p.id} value={p.id}>{p.naziv}</option>
                  ))}
                </select>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="ocena" className="form-label fw-semibold">Ocena (1–5) *</label>
                  <select
                    id="ocena"
                    className="form-select"
                    value={forma.ocena}
                    onChange={e => setForma(f => ({ ...f, ocena: e.target.value }))}
                    required
                  >
                    <option value="">—</option>
                    <option value="1">1 — Nedovoljan</option>
                    <option value="2">2 — Dovoljan</option>
                    <option value="3">3 — Dobar</option>
                    <option value="4">4 — Vrlo dobar</option>
                    <option value="5">5 — Odličan</option>
                  </select>
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="tromesecje" className="form-label fw-semibold">Tromesečje *</label>
                  <select
                    id="tromesecje"
                    className="form-select"
                    value={forma.tromesecje}
                    onChange={e => setForma(f => ({ ...f, tromesecje: e.target.value }))}
                    required
                  >
                    <option value="">—</option>
                    <option value="1">1. tromesečje</option>
                    <option value="2">2. tromesečje</option>
                    <option value="3">3. tromesečje</option>
                    <option value="4">4. tromesečje</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="komentar" className="form-label fw-semibold">
                  Komentar <span className="text-muted fw-normal">(opciono)</span>
                </label>
                <textarea
                  id="komentar"
                  className="form-control"
                  rows={2}
                  value={forma.komentar}
                  onChange={e => setForma(f => ({ ...f, komentar: e.target.value }))}
                  maxLength={500}
                />
              </div>

              <button type="submit" className="btn btn-primary w-100">
                <i className="bi bi-arrow-right me-2"></i>Nastavi
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
