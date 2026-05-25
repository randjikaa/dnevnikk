import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { Ucenik } from '../services/api';

export default function NastavnikUcenici() {
  const [ucenici, setUcenici] = useState<Ucenik[]>([]);
  const [ucitavanje, setUcitavanje] = useState(true);
  const [greska, setGreska] = useState('');
  const [pretraga, setPretraga] = useState('');

  useEffect(() => {
    api.get('/ocene/moji-ucenici')
      .then(res => setUcenici(res.data.ucenici))
      .catch(() => setGreska('Greška pri učitavanju učenika.'))
      .finally(() => setUcitavanje(false));
  }, []);

  const filtrirani = ucenici.filter(u =>
    `${u.ime} ${u.prezime} ${u.korisnicko_ime}`.toLowerCase().includes(pretraga.toLowerCase())
  );

  if (ucitavanje) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary"></div>
    </div>
  );

  return (
    <div>
      <h2 className="mb-4">
        <i className="bi bi-people me-2"></i>Moji učenici
      </h2>

      {greska && <div className="alert alert-danger">{greska}</div>}

      <div className="mb-3">
        <input
          type="search"
          className="form-control"
          placeholder="Pretraži učenike..."
          value={pretraga}
          onChange={e => setPretraga(e.target.value)}
        />
      </div>

      {filtrirani.length === 0 ? (
        <div className="alert alert-info">Nema učenika.</div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
          {filtrirani.map(u => (
            <div key={u.id} className="col">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-person-circle me-2 text-primary"></i>
                    {u.prezime} {u.ime}
                  </h5>
                  <p className="text-muted small mb-3">
                    <i className="bi bi-at me-1"></i>{u.korisnicko_ime}
                  </p>
                  <div className="d-flex gap-2">
                    <Link
                      to={`/nastavnik/ucenik/${u.id}`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      <i className="bi bi-card-list me-1"></i>Ocene
                    </Link>
                    <Link
                      to={`/nastavnik/zakljuci/${u.id}`}
                      className="btn btn-sm btn-outline-success"
                    >
                      <i className="bi bi-check2-circle me-1"></i>Zaključi
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
