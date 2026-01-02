import { Router } from "express";
import { UserController } from "#controllers/user.controller";
import { asyncHandler } from "#lib/async-handler";
import { auth } from "#middlewares/auth";

const router = Router();

// Consultation de la liste ou d'un utilisateur
router.get("/me", auth, asyncHandler(UserController.getMe));
router.patch("/me", auth, asyncHandler(UserController.updateMe));
router.get("/", auth, asyncHandler(UserController.getAll));
router.get("/:id", auth, asyncHandler(UserController.getById));



export default router;
