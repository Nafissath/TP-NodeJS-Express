import express from 'express';
import authMiddleware from '../middleware/auth.js';
import SessionsController from '../controllers/sessions.controller.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/auth/sessions - Liste les sessions
router.get('/', SessionsController.listSessions);

// DELETE /api/auth/sessions/:id - Révoque une session
router.delete('/:id', SessionsController.revokeSession);

// POST /api/auth/sessions/revoke-others - Révoque autres sessions
router.post('/revoke-others', SessionsController.revokeOtherSessions);

export default router;