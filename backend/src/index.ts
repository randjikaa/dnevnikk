import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRouter from './routes/auth';
import oceneRouter from './routes/ocene';
import adminRouter from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-promeniti',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 8 // 8 sati
  }
}));

// API rute
app.use('/api/auth', authRouter);
app.use('/api/ocene', oceneRouter);
app.use('/api/admin', adminRouter);

// Serviranje frontend builda
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server pokrenut na portu ${PORT}`);
});

export default app;
