import express from 'express';
import rateLimit from 'express-rate-limit';
import RefreshController from '../controllers/refresh.controller.js';

const router = express.Router();

// Rate limiting pour protéger contre le brute force
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requêtes maximum
  message: {
    success: false,
    error: 'Too many refresh attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// POST /api/auth/refresh - Rafraîchir les tokens
router.post('/', refreshLimiter, RefreshController.refreshTokens);

// GET /api/auth/refresh/test - Test de taille des tokens
router.get('/test', RefreshController.testTokenSize);

export default router;