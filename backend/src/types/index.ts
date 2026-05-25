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

export interface ZakljucnaOcena {
  id: number;
  ucenik_id: number;
  predmet_id: number;
  nastavnik_id: number;
  ocena: number;
  predlozena_ocena: number;
  obrazlozenje: string;
  unesena_u: string;
}

export interface ZahtevZaBrisanje {
  id: number;
  ocena_id: number;
  nastavnik_id: number;
  razlog: string;
  status: 'na_cekanju' | 'odobren' | 'odbijen';
  admin_komentar: string;
  kreiran_u: string;
  obradjen_u: string | null;
}

// Proširivanje Express Session tipova
declare module 'express-session' {
  interface SessionData {
    korisnik?: Korisnik;
  }
}
