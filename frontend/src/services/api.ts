import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true
});

export default api;

// Tipovi
export interface Korisnik {
  id: number;
  korisnicko_ime: string;
  uloga: 'ucenik' | 'nastavnik' | 'admin';
  ime: string;
  prezime: string;
  email: string;
}

export interface Ocena {
  id: number;
  ucenik_id: number;
  predmet_id: number;
  nastavnik_id: number;
  ocena: number;
  tromesecje: number;
  komentar: string;
  unesena_u: string;
  predmet_naziv: string;
  nastavnik_ime?: string;
  nastavnik_prezime?: string;
}

export interface ZakljucnaOcena {
  id: number;
  predmet_id: number;
  ocena: number;
  predlozena_ocena: number;
  obrazlozenje: string;
  predmet_naziv: string;
}

export interface Predmet {
  id: number;
  naziv: string;
}

export interface Ucenik {
  id: number;
  ime: string;
  prezime: string;
  korisnicko_ime: string;
}
