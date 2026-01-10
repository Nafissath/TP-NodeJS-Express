import express from 'express';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import { initializePassport } from './config/passport.js';

// Routes
import oauthRoutes from './routes/oauth.routes.js';
import refreshRoutes from './routes/refresh.routes.js';
import sessionsRoutes from './routes/sessions.routes.js';

// Charger les variables d'environnement
dotenv.config();
import { logger, httpLogger } from "#lib/logger";
import { errorHandler } from "#middlewares/error-handler";
import { notFoundHandler } from "#middlewares/not-found";
import userRouter from "#routes/user.routes";
import authRouter from "#routes/auth.routes";
import twoFactorRouter from "#routes/twoFactor.routes";
import { config } from "#config/env";
import { globalLimiter } from "#middlewares/rate-limit";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (nécessaire pour OAuth state)
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// Initialiser Passport
app.use(passport.initialize());
app.use(passport.session());
initializePassport();
// Utilisation des routes
app.use("/users", userRouter);
app.use("/api/auth", authRouter); // Routes authentifiées
app.use("/", authRouter); // Routes register/login à la racine
app.use("/api/2fa", twoFactorRouter); // Routes 2FA (Personne 4)

// Routes
app.use('/api/auth/oauth', oauthRoutes);
app.use('/api/auth/refresh', refreshRoutes);
app.use('/api/auth/sessions', sessionsRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({
    message: 'Authentication API - Personne 3 (OAuth & Sessions)',
    endpoints: {
      oauth: {
        providers: 'GET /api/auth/oauth/providers',
        google: 'GET /api/auth/oauth/google',
        github: 'GET /api/auth/oauth/github'
      },
      refresh: {
        refresh: 'POST /api/auth/refresh',
        test: 'GET /api/auth/refresh/test'
      },
      sessions: {
        list: 'GET /api/auth/sessions',
        revoke: 'DELETE /api/auth/sessions/:id',
        revokeOthers: 'POST /api/auth/sessions/revoke-others'
      }
    }
  });
});

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      oauth: 'available',
      refresh: 'available',
      sessions: 'available'
    }
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Documentation: http://localhost:${PORT}`);
  console.log(`🔗 OAuth Google: http://localhost:${PORT}/api/auth/oauth/google`);
  console.log(`🔗 OAuth GitHub: http://localhost:${PORT}/api/auth/oauth/github`);
  console.log(`🔄 Refresh: POST http://localhost:${PORT}/api/auth/refresh`);
  console.log(`👤 Sessions: GET http://localhost:${PORT}/api/auth/sessions`);
});

export default app;