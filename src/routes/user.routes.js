import { Router } from "express";
import { UserController } from "#controllers/user.controller";
import { asyncHandler } from "#lib/async-handler";
import { authLimiter } from "#middlewares/rate-limit";
import { auth } from "#middlewares/auth";
import { securityLimiter } from "#middlewares/rate-limit";

const router = Router();

// Consultation de la liste ou d'un utilisateur
router.get("/me", auth, asyncHandler(UserController.getMe));
router.patch("/me", auth, asyncHandler(UserController.updateMe));
router.post("/change-password", auth, securityLimiter, asyncHandler(UserController.changePassword));
router.delete("/me", auth, securityLimiter, asyncHandler(UserController.deleteMe));
router.get("/login-history", auth, asyncHandler(UserController.getLoginHistory));
router.get("/sessions", auth, asyncHandler(UserController.getSessions));
router.delete("/sessions/:id", auth, securityLimiter, asyncHandler(UserController.revokeSession));
router.delete("/sessions", auth, securityLimiter, asyncHandler(UserController.revokeOtherSessions));
router.get("/", auth, asyncHandler(UserController.getAll));
router.get("/:id", auth, asyncHandler(UserController.getById));



export default router;
