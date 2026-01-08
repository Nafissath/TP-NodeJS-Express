import { Router } from "express";
import { TwoFactorController } from "#controllers/twoFactor.controller";
import { asyncHandler } from "#lib/async-handler";
import { auth } from "#middlewares/auth";
import { securityLimiter } from "#middlewares/rate-limit";

const router = Router();

router.post("/setup", auth, securityLimiter, asyncHandler(TwoFactorController.setup));
router.post("/enable", auth, securityLimiter, asyncHandler(TwoFactorController.enable));
router.post("/verify", auth, securityLimiter, asyncHandler(TwoFactorController.verify));
router.post("/disable", auth, securityLimiter, asyncHandler(TwoFactorController.disable));
router.get("/status", auth, asyncHandler(TwoFactorController.status));

export default router;
