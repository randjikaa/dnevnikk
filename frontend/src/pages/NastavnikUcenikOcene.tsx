import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { Ocena } from '../services/api';

export default function NastavnikUcenikOcene() {
  const { ucenikId } = useParams<{ ucenikId: string }>();
  const [ocene, setOcene] = useState<Ocena[]>([]);
  const [ucitavanje, setUcitavanje] = useState(true);
  const [zahtevZaOcenu, setZahtevZaOcenu] = useState<number | null>(null);
  const [razlog, setRazlog] = useState('');
  const [poruke, setPoruke] = useState<Record<number, string>>({});
  const [greske, setGreske] = useState<Record<number, string>>({});

  const ucitaj = () => {
    api.get(`/ocene/ucenik/${ucenikId}`)
      .then(res => setOcene(res.data.ocene))
      .finally(() => setUcitavanje(false));
  };

  useEffect(() => { ucitaj(); }, [ucenikId]);

  const posaljiZahtev = async (ocenaId: number) => {
    if (!razlog.trim() || razlog.trim().length < 10) {
      setGreske(g => ({ ...g, [ocenaId]: 'Razlog mora imati najmanje 10 karaktera.' }));
      return;
    }

    try {
      await api.post('/ocene/zahtev-brisanje', { ocena_id: ocenaId, razlog: razlog.trim() });
      setPoruke(p => ({ ...p, [ocenaId]: 'Zahtev je poslat adminu.' }));
      setZahtevZaOcenu(null);
      setRazlog('');
      setGreske(g => { const n = { ...g }; delete n[ocenaId]; return n; });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { greska?: string } } };
      setGreske(g => ({ ...g, [ocenaId]: error.response?.data?.greska || 'Greška.' }));
    }
  };

  const grupiranePoTromesecjima: Record<number, Record<string, Ocena[]>> = {};
  ocene.forEach(o => {
    if (!grupiranePoTromesecjima[o.tromesecje]) grupiranePoTromesecjima[o.tromesecje] = {};
    if (!grupiranePoTromesecjima[o.tromesecje][o.predmet_naziv])
      grupiranePoTromesecjima[o.tromesecje][o.predmet_naziv] = [];
    grupiranePoTromesecjima[o.tromesecje][o.predmet_naziv].push(o);
  });

  if (ucitavanje) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div>
      <h2 className="mb-4">
        <i className="bi bi-card-list me-2"></i>Ocene učenika
      </h2>

      {Object.entries(grupiranePoTromesecjima).map(([t, predmeti]) => (
        <div key={t} className="mb-4">
          <h5 className="border-bottom pb-2 text-primary">{t}. tromesečje</h5>
          {Object.entries(predmeti).map(([predmet, predmetOcene]) => (
            <div key={predmet} className="mb-3">
              <h6 className="text-muted">{predmet}</h6>
              <div className="table-responsive">
                <table className="table table-sm table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Ocena</th>
                      <th>Komentar</th>
                      <th>Datum</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {predmetOcene.map(o => (
                      <React.Fragment key={o.id}>
                        <tr>
                          <td>
                            <span className={`badge fs-6 ${
                              o.ocena >= 4 ? 'bg-success' :
                              o.ocena === 3 ? 'bg-warning text-dark' : 'bg-danger'
                            }`}>{o.ocena}</span>
                          </td>
                          <td>{o.komentar || <em className="text-muted">—</em>}</td>
                          <td className="text-muted small">
                            {new Date(o.unesena_u).toLocaleDateString('sr-RS')}
                          </td>
                          <td>
                            {poruke[o.id] ? (
                              <span className="text-success small">
                                <i className="bi bi-check-circle me-1"></i>{poruke[o.id]}
                              </span>
                            ) : (
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => {
                                  setZahtevZaOcenu(zahtevZaOcenu === o.id ? null : o.id);
                                  setRazlog('');
                                }}
                              >
                                <i className="bi bi-trash me-1"></i>Zatraži brisanje
                              </button>
                            )}
                          </td>
                        </tr>
                        {zahtevZaOcenu === o.id && (
                          <tr>
                            <td colSpan={4}>
                              <div className="p-2 bg-light rounded border">
                                <label className="form-label small fw-semibold">
                                  Razlog za brisanje (min. 10 karaktera):
                                </label>
                                <textarea
                                  className="form-control form-control-sm mb-2"
                                  rows={2}
                                  value={razlog}
                                  onChange={e => setRazlog(e.target.value)}
                                  minLength={10}
                                />
                                {greske[o.id] && (
                                  <div className="text-danger small mb-2">{greske[o.id]}</div>
                                )}
                                <div className="d-flex gap-2">
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => posaljiZahtev(o.id)}
                                  >
                                    <i className="bi bi-send me-1"></i>Pošalji zahtev
                                  </button>
                                  <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => setZahtevZaOcenu(null)}
                                  >
                                    Odustani
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ))}

      {ocene.length === 0 && (
        <div className="alert alert-info">Ovaj učenik nema ocena za vaše predmete.</div>
      )}
    </div>
  );
}
