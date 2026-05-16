import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import xss from 'xss-clean';
import morgan from 'morgan';
import csrf from 'csurf';
import 'express-async-errors';

import config from './config';
import authRoutes from './routes/auth';
import errorHandler from './middlewares/errorHandler';
import logger from './lib/logger';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: config.ALLOWED_ORIGINS, credentials: true }));
app.use(compression());
app.use(hpp());
app.use(xss());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

const csrfProtection = csrf({ cookie: { httpOnly: true, sameSite: 'lax' } });
app.use('/api', csrfProtection, (req, res, next) => {
  try{
    res.cookie('XSRF-TOKEN', req.csrfToken(), { httpOnly: false });
  }catch(e){}
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: config.NODE_ENV });
});

app.use('/api/auth', authRoutes);

app.use(errorHandler);

export default app;
