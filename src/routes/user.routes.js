import { Router } from "express";
import { UserController } from "#controllers/user.controller";
import { asyncHandler } from "#lib/async-handler";
import { auth } from "#middlewares/auth";

const router = Router();

// Consultation de la liste ou d'un utilisateur
router.get("/me", auth, asyncHandler(UserController.getMe));
router.patch("/me", auth, asyncHandler(UserController.updateMe));
router.post("/change-password", auth, asyncHandler(UserController.changePassword));
router.delete("/me", auth, asyncHandler(UserController.deleteMe));
router.get("/login-history", auth, asyncHandler(UserController.getLoginHistory));
router.get("/sessions", auth, asyncHandler(UserController.getSessions));
router.delete("/sessions/:id", auth, asyncHandler(UserController.revokeSession));
router.delete("/sessions", auth, asyncHandler(UserController.revokeOtherSessions));
router.get("/", auth, asyncHandler(UserController.getAll));
router.get("/:id", auth, asyncHandler(UserController.getById));



export default router;
