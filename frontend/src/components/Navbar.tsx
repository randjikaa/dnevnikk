import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

export default function Navbar() {
  const { korisnik, odjavi } = useAuth();
  const navigate = useNavigate();

  const handleOdjava = async () => {
    await odjavi();
    navigate('/prijava');
  };

  const ulogaLabel: Record<string, string> = {
    ucenik: 'Učenik',
    nastavnik: 'Nastavnik',
    admin: 'Administrator'
  };

  const ulogaBadge: Record<string, string> = {
    ucenik: 'bg-success',
    nastavnik: 'bg-primary',
    admin: 'bg-danger'
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          <i className="bi bi-journal-text me-2"></i>
          E-Dnevnik
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Otvori navigaciju"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {korisnik?.uloga === 'nastavnik' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/nastavnik/ucenici">
                    <i className="bi bi-people me-1"></i>Učenici
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/nastavnik/unos-ocene">
                    <i className="bi bi-plus-circle me-1"></i>Unos ocene
                  </Link>
                </li>
              </>
            )}
            {korisnik?.uloga === 'ucenik' && (
              <li className="nav-item">
                <Link className="nav-link" to="/ucenik/ocene">
                  <i className="bi bi-card-list me-1"></i>Moje ocene
                </Link>
              </li>
            )}
            {korisnik?.uloga === 'admin' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/admin/zahtevi">
                    <i className="bi bi-inbox me-1"></i>Zahtevi
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/admin/pregled">
                    <i className="bi bi-people me-1"></i>Pregled
                  </Link>
                </li>
              </>
            )}
          </ul>

          {korisnik && (
            <div className="d-flex align-items-center gap-2">
              <span className={`badge ${ulogaBadge[korisnik.uloga]}`}>
                {ulogaLabel[korisnik.uloga]}
              </span>
              <span className="text-white small">
                {korisnik.ime} {korisnik.prezime}
              </span>
              <button
                className="btn btn-outline-light btn-sm"
                onClick={handleOdjava}
              >
                <i className="bi bi-box-arrow-right me-1"></i>Odjava
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
