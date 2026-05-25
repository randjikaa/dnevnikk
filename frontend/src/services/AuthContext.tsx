import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { Korisnik } from '../services/api';

interface AuthContextType {
  korisnik: Korisnik | null;
  ucitavanje: boolean;
  prijavi: (korisnickoIme: string, lozinka: string) => Promise<void>;
  odjavi: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [korisnik, setKorisnik] = useState<Korisnik | null>(null);
  const [ucitavanje, setUcitavanje] = useState(true);

  useEffect(() => {
    api.get('/auth/ja')
      .then(res => setKorisnik(res.data.korisnik))
      .catch(() => setKorisnik(null))
      .finally(() => setUcitavanje(false));
  }, []);

  const prijavi = async (korisnickoIme: string, lozinka: string) => {
    const res = await api.post('/auth/prijava', {
      korisnicko_ime: korisnickoIme,
      lozinka
    });
    setKorisnik(res.data.korisnik);
  };

  const odjavi = async () => {
    await api.post('/auth/odjava');
    setKorisnik(null);
  };

  return (
    <AuthContext.Provider value={{ korisnik, ucitavanje, prijavi, odjavi }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth mora biti unutar AuthProvider');
  return ctx;
}
