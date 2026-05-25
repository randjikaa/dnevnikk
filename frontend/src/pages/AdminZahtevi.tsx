import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Zahtev {
  id: number;
  ocena_id: number;
  ocena: number;
  tromesecje: number;
  predmet_naziv: string;
  ucenik_ime: string;
  ucenik_prezime: string;
  nastavnik_ime: string;
  nastavnik_prezime: string;
  razlog: string;
  status: 'na_cekanju' | 'odobren' | 'odbijen';
  admin_komentar: string;
  kreiran_u: string;
  obradjen_u: string | null;
}

export default function AdminZahtevi() {
  const [zahtevi, setZahtevi] = useState<Zahtev[]>([]);
  const [ucitavanje, setUcitavanje] = useState(true);
  const [obrada, setObrada] = useState<number | null>(null);
  const [komentari, setKomentari] = useState<Record<number, string>>({});
  const [greska, setGreska] = useState('');
  const [poruka, setPoruka] = useState('');

  const ucitaj = () => {
    setUcitavanje(true);
    api.get('/ocene/zahtevi-brisanje')
      .then(res => setZahtevi(res.data.zahtevi))
      .catch(() => setGreska('Greška pri učitavanju zahteva.'))
      .finally(() => setUcitavanje(false));
  };

  useEffect(() => { ucitaj(); }, []);

  const obradi = async (zahtevId: number, akcija: 'odobren' | 'odbijen') => {
    setGreska('');
    setPoruka('');
    try {
      const res = await api.post(`/ocene/zahtevi-brisanje/${zahtevId}/obradi`, {
        akcija,
        admin_komentar: komentari[zahtevId] || ''
      });
      setPoruka(res.data.poruka);
      ucitaj();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { greska?: string } } };
      setGreska(error.response?.data?.greska || 'Greška.');
    }
  };

  const naCekanju = zahtevi.filter(z => z.status === 'na_cekanju');
  const obradjeni = zahtevi.filter(z => z.status !== 'na_cekanju');

  const statusBadge = (s: string) => {
    if (s === 'na_cekanju') return <span className="badge bg-warning text-dark">Na čekanju</span>;
    if (s === 'odobren') return <span className="badge bg-success">Odobren</span>;
    return <span className="badge bg-danger">Odbijen</span>;
  };

  if (ucitavanje) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary"></div>
    </div>
  );

  return (
    <div>
      <h2 className="mb-4">
        <i className="bi bi-inbox me-2"></i>Zahtevi za brisanje ocena
      </h2>

      {greska && <div className="alert alert-danger">{greska}</div>}
      {poruka && <div className="alert alert-success">{poruka}</div>}

      {naCekanju.length === 0 && (
        <div className="alert alert-info">
          <i className="bi bi-check-circle me-2"></i>Nema zahteva na čekanju.
        </div>
      )}

      {naCekanju.map(z => (
        <div key={z.id} className="card mb-3 border-warning shadow-sm">
          <div className="card-header bg-warning d-flex justify-content-between">
            <strong>Zahtev #{z.id}</strong>
            {statusBadge(z.status)}
          </div>
          <div className="card-body">
            <div className="row mb-2">
              <div className="col-md-6">
                <p className="mb-1">
                  <strong>Učenik:</strong> {z.ucenik_prezime} {z.ucenik_ime}
                </p>
                <p className="mb-1">
                  <strong>Predmet:</strong> {z.predmet_naziv}
                </p>
                <p className="mb-1">
                  <strong>Ocena:</strong>{' '}
                  <span className="badge bg-primary fs-6">{z.ocena}</span>{' '}
                  ({z.tromesecje}. tromesečje)
                </p>
              </div>
              <div className="col-md-6">
                <p className="mb-1">
                  <strong>Nastavnik:</strong> {z.nastavnik_prezime} {z.nastavnik_ime}
                </p>
                <p className="mb-1">
                  <strong>Razlog:</strong> {z.razlog}
                </p>
                <p className="mb-1 text-muted small">
                  Kreiran: {new Date(z.kreiran_u).toLocaleString('sr-RS')}
                </p>
              </div>
            </div>

            {obrada === z.id ? (
              <div className="mt-2">
                <label className="form-label small fw-semibold">Komentar admina (opciono):</label>
                <textarea
                  className="form-control form-control-sm mb-2"
                  rows={2}
                  value={komentari[z.id] || ''}
                  onChange={e => setKomentari(k => ({ ...k, [z.id]: e.target.value }))}
                  placeholder="Napomena uz odluku..."
                />
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => obradi(z.id, 'odobren')}
                  >
                    <i className="bi bi-check2 me-1"></i>Odobri i obriši ocenu
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => obradi(z.id, 'odbijen')}
                  >
                    <i className="bi bi-x me-1"></i>Odbij zahtev
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setObrada(null)}
                  >
                    Odustani
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-warning btn-sm mt-1"
                onClick={() => setObrada(z.id)}
              >
                <i className="bi bi-pencil-square me-1"></i>Obradi zahtev
              </button>
            )}
          </div>
        </div>
      ))}

      {obradjeni.length > 0 && (
        <>
          <h5 className="mt-4 mb-3 text-muted">Obrađeni zahtevi</h5>
          {obradjeni.map(z => (
            <div key={z.id} className="card mb-2 opacity-75">
              <div className="card-body py-2">
                <div className="d-flex justify-content-between align-items-center">
                  <span>
                    <strong>#{z.id}</strong> — {z.ucenik_prezime} {z.ucenik_ime},{' '}
                    {z.predmet_naziv}, ocena {z.ocena} ({z.tromesecje}. tr.)
                  </span>
                  <div className="d-flex align-items-center gap-2">
                    {statusBadge(z.status)}
                    <small className="text-muted">
                      {z.obradjen_u ? new Date(z.obradjen_u).toLocaleDateString('sr-RS') : ''}
                    </small>
                  </div>
                </div>
                {z.admin_komentar && (
                  <small className="text-muted d-block mt-1">
                    <i className="bi bi-chat me-1"></i>{z.admin_komentar}
                  </small>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
