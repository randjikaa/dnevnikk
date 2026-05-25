import React, { useEffect, useState, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import api, { Predmet, Ocena } from '../services/api';

interface Prosek {
  po_tromesecjima: { tromesecje: number; prosek: number; broj_ocena: number }[];
  ukupni_prosek: number;
  predlozena_zakljucna_ocena: number;
}

export default function ZakljuciOcenu() {
  const { ucenikId } = useParams<{ ucenikId: string }>();
  const [predmeti, setPredmeti] = useState<Predmet[]>([]);
  const [odabraniPredmet, setOdabraniPredmet] = useState('');
  const [prosek, setProsek] = useState<Prosek | null>(null);
  const [ocene, setOcene] = useState<Ocena[]>([]);
  const [novaOcena, setNovaOcena] = useState('');
  const [obrazlozenje, setObrazlozenje] = useState('');
  const [poruka, setPoruka] = useState('');
  const [greska, setGreska] = useState('');
  const [ucitavanje, setUcitavanje] = useState(false);

  useEffect(() => {
    api.get('/ocene/moji-predmeti')
      .then(res => setPredmeti(res.data.predmeti));
  }, []);

  useEffect(() => {
    if (!odabraniPredmet || !ucenikId) return;
    Promise.all([
      api.get(`/ocene/prosek/${ucenikId}/${odabraniPredmet}`),
      api.get(`/ocene/ucenik/${ucenikId}`)
    ]).then(([prosekRes, oceneRes]) => {
      setProsek(prosekRes.data);
      const predmetOcene = (oceneRes.data.ocene as Ocena[]).filter(
        o => o.predmet_id === parseInt(odabraniPredmet)
      );
      setOcene(predmetOcene);
      setNovaOcena(String(prosekRes.data.predlozena_zakljucna_ocena));
    });
  }, [odabraniPredmet, ucenikId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGreska('');
    setPoruka('');

    const ocenaNum = parseInt(novaOcena);
    if (prosek && ocenaNum > prosek.predlozena_zakljucna_ocena && !obrazlozenje.trim()) {
      setGreska('Obrazloženje je obavezno kada je ocena veća od predložene.');
      return;
    }

    setUcitavanje(true);
    try {
      await api.post('/ocene/zakljuci', {
        ucenik_id: parseInt(ucenikId!),
        predmet_id: parseInt(odabraniPredmet),
        ocena: ocenaNum,
        obrazlozenje: obrazlozenje || undefined
      });
      setPoruka('Zaključna ocena je uspešno upisana!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { greska?: string } } };
      setGreska(error.response?.data?.greska || 'Greška.');
    } finally {
      setUcitavanje(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <h2 className="mb-4">
          <i className="bi bi-check2-circle me-2"></i>Zaključivanje ocene
        </h2>

        {greska && <div className="alert alert-danger">{greska}</div>}
        {poruka && <div className="alert alert-success">{poruka}</div>}

        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <label className="form-label fw-semibold">Odaberite predmet</label>
            <select
              className="form-select"
              value={odabraniPredmet}
              onChange={e => { setOdabraniPredmet(e.target.value); setProsek(null); }}
            >
              <option value="">— Odaberite predmet —</option>
              {predmeti.map(p => (
                <option key={p.id} value={p.id}>{p.naziv}</option>
              ))}
            </select>
          </div>
        </div>

        {prosek && (
          <>
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light fw-semibold">
                Pregled ocena po tromesečjima
              </div>
              <div className="card-body">
                <div className="row mb-2">
                  {prosek.po_tromesecjima.map(t => (
                    <div key={t.tromesecje} className="col-6 col-md-3 mb-2">
                      <div className="border rounded p-2 text-center">
                        <div className="text-muted small">{t.tromesecje}. tromesečje</div>
                        <div className="fw-bold fs-5">{t.prosek}</div>
                        <div className="text-muted small">{t.broj_ocena} ocena</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
                  <span>Ukupni prosek: <strong>{prosek.ukupni_prosek}</strong></span>
                  <span>
                    Predložena zaključna:
                    <span className="badge bg-primary ms-2 fs-6">
                      {prosek.predlozena_zakljucna_ocena}
                    </span>
                  </span>
                </div>

                <div className="d-flex flex-wrap gap-1 mt-3">
                  {ocene.map(o => (
                    <span key={o.id} className="badge bg-secondary">
                      {o.ocena} ({o.tromesecje}. tr.)
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="card shadow-sm">
              <div className="card-header bg-success text-white fw-semibold">
                <i className="bi bi-pencil-square me-2"></i>Zaključna ocena
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Zaključna ocena</label>
                  <select
                    className="form-select"
                    value={novaOcena}
                    onChange={e => setNovaOcena(e.target.value)}
                    required
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>
                        {n}{n === prosek.predlozena_zakljucna_ocena ? ' (predložena)' : ''}
                        {n > prosek.predlozena_zakljucna_ocena ? ' ⚠ viša od predložene' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {parseInt(novaOcena) > prosek.predlozena_zakljucna_ocena && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Obrazloženje *
                      <small className="text-danger ms-1">(obavezno jer je ocena viša od predložene)</small>
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={obrazlozenje}
                      onChange={e => setObrazlozenje(e.target.value)}
                      required
                      minLength={10}
                    />
                  </div>
                )}

                <button type="submit" className="btn btn-success" disabled={ucitavanje}>
                  {ucitavanje
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Upisujem...</>
                    : <><i className="bi bi-check2-all me-1"></i>Zaključi ocenu</>
                  }
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
