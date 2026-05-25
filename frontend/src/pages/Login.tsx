import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

export default function Login() {
  const { prijavi } = useAuth();
  const navigate = useNavigate();
  const [korisnickoIme, setKorisnickoIme] = useState('');
  const [lozinka, setLozinka] = useState('');
  const [greska, setGreska] = useState('');
  const [ucitavanje, setUcitavanje] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGreska('');

    // Frontend validacija
    if (!korisnickoIme.trim() || !lozinka) {
      setGreska('Popunite sva polja.');
      return;
    }
    if (korisnickoIme.length < 3) {
      setGreska('Korisničko ime je prekratko.');
      return;
    }
    if (lozinka.length < 6) {
      setGreska('Lozinka je prekratka.');
      return;
    }

    setUcitavanje(true);
    try {
      await prijavi(korisnickoIme.trim(), lozinka);
      navigate('/');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { greska?: string } } };
      setGreska(error.response?.data?.greska || 'Greška pri prijavi.');
    } finally {
      setUcitavanje(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm" style={{ maxWidth: 420, width: '100%' }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <i className="bi bi-journal-text fs-1 text-primary"></i>
            <h1 className="h4 mt-2 fw-bold">Elektronski dnevnik</h1>
            <p className="text-muted small">Prijava na sistem</p>
          </div>

          {greska && (
            <div className="alert alert-danger py-2 small" role="alert">
              <i className="bi bi-exclamation-circle me-1"></i>
              {greska}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="korisnickoIme" className="form-label fw-semibold">
                Korisničko ime
              </label>
              <input
                id="korisnickoIme"
                type="text"
                className="form-control"
                value={korisnickoIme}
                onChange={e => setKorisnickoIme(e.target.value)}
                autoComplete="username"
                required
                minLength={3}
                maxLength={50}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="lozinka" className="form-label fw-semibold">
                Lozinka
              </label>
              <input
                id="lozinka"
                type="password"
                className="form-control"
                value={lozinka}
                onChange={e => setLozinka(e.target.value)}
                autoComplete="current-password"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={ucitavanje}
            >
              {ucitavanje
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Prijava...</>
                : <><i className="bi bi-box-arrow-in-right me-2"></i>Prijavi se</>
              }
            </button>
          </form>

          <div className="mt-3 text-center text-muted small">
            <strong>Demo nalozi</strong> (lozinka: <code>lozinka123</code>)<br />
            Nastavnik: <code>petar.petrovic</code> &bull; Učenik: <code>jovan.jovanovic</code><br />
            Admin: <code>admin</code>
          </div>
        </div>
      </div>
    </div>
  );
}
