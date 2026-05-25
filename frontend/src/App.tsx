import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import UcenikOcene from './pages/UcenikOcene';
import UnosOcene from './pages/UnosOcene';
import NastavnikUcenici from './pages/NastavnikUcenici';
import NastavnikUcenikOcene from './pages/NastavnikUcenikOcene';
import ZakljuciOcenu from './pages/ZakljuciOcenu';
import AdminZahtevi from './pages/AdminZahtevi';

function RouterContent() {
  const { korisnik, ucitavanje } = useAuth();

  if (ucitavanje) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3"></div>
          <p className="text-muted">Učitavanje...</p>
        </div>
      </div>
    );
  }

  if (!korisnik) {
    return (
      <Routes>
        <Route path="/prijava" element={<Login />} />
        <Route path="*" element={<Navigate to="/prijava" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container py-4">
        <Routes>
          {korisnik.uloga === 'ucenik' && (
            <>
              <Route path="/" element={<Navigate to="/ucenik/ocene" replace />} />
              <Route path="/ucenik/ocene" element={<UcenikOcene />} />
            </>
          )}

          {korisnik.uloga === 'nastavnik' && (
            <>
              <Route path="/" element={<Navigate to="/nastavnik/ucenici" replace />} />
              <Route path="/nastavnik/ucenici" element={<NastavnikUcenici />} />
              <Route path="/nastavnik/unos-ocene" element={<UnosOcene />} />
              <Route path="/nastavnik/ucenik/:ucenikId" element={<NastavnikUcenikOcene />} />
              <Route path="/nastavnik/zakljuci/:ucenikId" element={<ZakljuciOcenu />} />
            </>
          )}

          {korisnik.uloga === 'admin' && (
            <>
              <Route path="/" element={<Navigate to="/admin/zahtevi" replace />} />
              <Route path="/admin/zahtevi" element={<AdminZahtevi />} />
            </>
          )}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RouterContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
