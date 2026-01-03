import { Router } from "express";
import { UserController } from "#controllers/user.controller";
import { asyncHandler } from "#lib/async-handler";
import { authLimiter } from "#middlewares/rate-limit";
import { auth } from "#middlewares/auth";

const router = Router();

// Inscription et Connexion
router.post("/register", authLimiter, asyncHandler(UserController.register));
router.post("/login", authLimiter, asyncHandler(UserController.login));

// Déconnexion 
router.post("/logout", auth, asyncHandler(UserController.logout));

export default router;
