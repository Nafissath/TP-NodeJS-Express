import { Router } from "express";
import { UserController } from "#controllers/user.controller";
import { asyncHandler } from "#lib/async-handler";

const router = Router();

router.get("/", asyncHandler(UserController.getAll));
router.get("/:id", auth, asyncHandler(UserController.getById));

export default router;
