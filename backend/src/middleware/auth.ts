import { Request, Response, NextFunction } from 'express';

export function zahtevajPrijavu(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.korisnik) {
    res.status(401).json({ greska: 'Niste prijavljeni.' });
    return;
  }
  next();
}

export function zahtevajUlogu(...uloge: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.korisnik) {
      res.status(401).json({ greska: 'Niste prijavljeni.' });
      return;
    }
    if (!uloge.includes(req.session.korisnik.uloga)) {
      res.status(403).json({ greska: 'Nemate dozvolu za ovu akciju.' });
      return;
    }
    next();
  };
}
