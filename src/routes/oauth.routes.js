import express from 'express';
import passport from 'passport';
import OAuthController from '../controllers/oauth.controller.js';

const router = express.Router();

// GET /api/auth/oauth/providers - Liste les providers
router.get('/providers', OAuthController.listProviders);

// GET /api/auth/oauth/google - Initie Google OAuth
router.get('/google', OAuthController.initiateOAuth('google'));

// GET /api/auth/oauth/google/callback - Callback Google
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/api/auth/oauth/error'
  }),
  OAuthController.handleCallback
);

// GET /api/auth/oauth/github - Initie GitHub OAuth
router.get('/github', OAuthController.initiateOAuth('github'));

// GET /api/auth/oauth/github/callback - Callback GitHub
router.get('/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: '/api/auth/oauth/error'
  }),
  OAuthController.handleCallback
);

// GET /api/auth/oauth/error - Route d'erreur
router.get('/error', OAuthController.oauthError);

export default router;