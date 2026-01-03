import { Router } from "express";
import { UserController } from "#controllers/user.controller";
import { verifyEmail, resendVerification, forgotPassword, resetPassword, cleanupTokens } from "#controllers/email-verification.controller";
import { asyncHandler } from "#lib/async-handler";
import { authLimiter } from "#middlewares/rate-limit";
import { auth } from "#middlewares/auth";

const router = Router();

// Inscription et Connexion
router.post("/register", authLimiter, asyncHandler(UserController.register));
router.post("/login", authLimiter, asyncHandler(UserController.login));

// Déconnexion 
router.post("/logout", auth, asyncHandler(UserController.logout));

// Vérification Email
router.post("/verify-email/:token", authLimiter, asyncHandler(verifyEmail));
router.post("/resend-verification", authLimiter, asyncHandler(resendVerification));

// Mot de passe oublié
router.post("/forgot-password", authLimiter, asyncHandler(forgotPassword));
router.post("/reset-password/:token", authLimiter, asyncHandler(resetPassword));

// Nettoyage tokens (admin ou cron)
router.post("/cleanup-tokens", asyncHandler(cleanupTokens));

export default router;
