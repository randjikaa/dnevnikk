export interface Korisnik {
  id: number;
  korisnicko_ime: string;
  uloga: 'ucenik' | 'nastavnik' | 'admin';
  ime: string;
  prezime: string;
  email: string;
}

export interface Predmet {
  id: number;
  naziv: string;
  opis: string;
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
}

declare module 'express-session' {
  interface SessionData {
    korisnik?: Korisnik;
  }
}
