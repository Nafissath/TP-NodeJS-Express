import { Router } from "express";
import { SessionsController } from "#controllers/sessions.controller";
import { auth } from "#middlewares/auth";
import { asyncHandler } from "#lib/async-handler";

const router = Router();

// Toutes les routes de session demandent d'être authentifié
router.use(auth);

router.get("/", asyncHandler(SessionsController.getActiveSessions));
router.post("/revoke-others", asyncHandler(SessionsController.revokeOtherSessions));

export default router;