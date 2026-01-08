import { Router } from "express";
import { UserController } from "#controllers/user.controller";
import { verifyEmail, resendVerification, forgotPassword, resetPassword, cleanupTokens } from "#controllers/email-verification.controller";
import { asyncHandler } from "#lib/async-handler";
import { authLimiter } from "#middlewares/rate-limit";
import { auth } from "#middlewares/auth";

const router = Router();

// Routes Personne 1 (existantes)
router.post("/register", authLimiter, asyncHandler(UserController.register));
router.post("/login", authLimiter, asyncHandler(UserController.login));
router.post("/logout", auth, asyncHandler(UserController.logout));

// Routes Personne 2 - Vérification Email & Tokens
router.post("/resend-verification", authLimiter, asyncHandler(resendVerification));
router.post("/verify-email/:token", authLimiter, asyncHandler(verifyEmail));
router.post("/forgot-password", authLimiter, asyncHandler(forgotPassword));
router.post("/reset-password/:token", authLimiter, asyncHandler(resetPassword));
router.post("/cleanup-tokens", authLimiter, asyncHandler(cleanupTokens));

export default router;
