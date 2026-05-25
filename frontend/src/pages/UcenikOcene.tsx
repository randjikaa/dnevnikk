import React, { useEffect, useState } from 'react';
import api, { Ocena, ZakljucnaOcena } from '../services/api';

interface GrupiraneOcene {
  [predmet: string]: {
    predmet_id: number;
    tromesecja: {
      [t: number]: Ocena[];
    };
    zakljucna?: ZakljucnaOcena;
  };
}

export default function UcenikOcene() {
  const [grupirane, setGrupirane] = useState<GrupiraneOcene>({});
  const [ucitavanje, setUcitavanje] = useState(true);
  const [greska, setGreska] = useState('');

  useEffect(() => {
    api.get('/ocene/moje')
      .then(res => {
        const { ocene, zakljucne } = res.data as { ocene: Ocena[], zakljucne: ZakljucnaOcena[] };
        const g: GrupiraneOcene = {};

        ocene.forEach(o => {
          if (!g[o.predmet_naziv]) {
            g[o.predmet_naziv] = { predmet_id: o.predmet_id, tromesecja: {} };
          }
          if (!g[o.predmet_naziv].tromesecja[o.tromesecje]) {
            g[o.predmet_naziv].tromesecja[o.tromesecje] = [];
          }
          g[o.predmet_naziv].tromesecja[o.tromesecje].push(o);
        });

        zakljucne.forEach(zo => {
          if (g[zo.predmet_naziv]) {
            g[zo.predmet_naziv].zakljucna = zo;
          }
        });

        setGrupirane(g);
      })
      .catch(() => setGreska('Greška pri učitavanju ocena.'))
      .finally(() => setUcitavanje(false));
  }, []);

  const prosekBoja = (p: number) => {
    if (p >= 4.5) return 'text-success fw-bold';
    if (p >= 3.5) return 'text-primary fw-bold';
    if (p >= 2.5) return 'text-warning fw-bold';
    return 'text-danger fw-bold';
  };

  if (ucitavanje) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary"></div>
      <p className="mt-2 text-muted">Učitavanje ocena...</p>
    </div>
  );

  if (greska) return <div className="alert alert-danger">{greska}</div>;

  if (Object.keys(grupirane).length === 0) return (
    <div className="alert alert-info">
      <i className="bi bi-info-circle me-2"></i>
      Nemate unesenih ocena.
    </div>
  );

  return (
    <div>
      <h2 className="mb-4">
        <i className="bi bi-card-list me-2"></i>Moje ocene
      </h2>

      {Object.entries(grupirane).map(([predmet, data]) => {
        const sveOcene = Object.values(data.tromesecja).flat();
        const ukupniProsek = sveOcene.reduce((s, o) => s + o.ocena, 0) / (sveOcene.length || 1);

        return (
          <div key={predmet} className="card mb-4 shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-book me-2"></i>{predmet}
              </h5>
              <div className="d-flex align-items-center gap-3">
                <span className="small">
                  Prosek: <span className={`badge bg-light ${prosekBoja(ukupniProsek)}`}>
                    {ukupniProsek.toFixed(2)}
                  </span>
                </span>
                {data.zakljucna && (
                  <span className="badge bg-warning text-dark">
                    <i className="bi bi-check2-circle me-1"></i>
                    Zaključna: {data.zakljucna.ocena}
                  </span>
                )}
              </div>
            </div>

            <div className="card-body">
              <div className="row">
                {[1, 2, 3, 4].map(t => (
                  <div key={t} className="col-md-3 col-sm-6 mb-3">
                    <h6 className="text-muted border-bottom pb-1">
                      {t}. tromesečje
                    </h6>
                    {data.tromesecja[t] && data.tromesecja[t].length > 0 ? (
                      <>
                        <div className="d-flex flex-wrap gap-1 mb-2">
                          {data.tromesecja[t].map(o => (
                            <span
                              key={o.id}
                              className={`badge fs-6 ${
                                o.ocena === 5 ? 'bg-success' :
                                o.ocena === 4 ? 'bg-primary' :
                                o.ocena === 3 ? 'bg-warning text-dark' :
                                o.ocena === 2 ? 'bg-danger' : 'bg-secondary'
                              }`}
                              title={o.komentar || ''}
                            >
                              {o.ocena}
                            </span>
                          ))}
                        </div>
                        <small className="text-muted">
                          Prosek: {(data.tromesecja[t].reduce((s, o) => s + o.ocena, 0) / data.tromesecja[t].length).toFixed(2)}
                        </small>
                      </>
                    ) : (
                      <p className="text-muted small">Nema ocena</p>
                    )}
                  </div>
                ))}
              </div>

              {data.zakljucna?.obrazlozenje && (
                <div className="alert alert-warning py-2 mt-2 small">
                  <i className="bi bi-chat-quote me-1"></i>
                  <strong>Obrazloženje nastavnika:</strong> {data.zakljucna.obrazlozenje}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
