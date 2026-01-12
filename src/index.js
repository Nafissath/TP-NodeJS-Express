import 'dotenv/config';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

import { logger, httpLogger } from "#lib/logger";
import { errorHandler } from "#middlewares/error-handler";
import { notFoundHandler } from "#middlewares/not-found";
import userRouter from "#routes/user.routes";
import authRouter from "#routes/auth.routes";
import twoFactorRouter from "#routes/twoFactor.routes";
import sessionsRouter from "#routes/sessions.routes"; 
import "./config/passport.js";
import { config } from "#config/env";
import { globalLimiter } from "#middlewares/rate-limit";

const app = express();
app.use(globalLimiter);
const PORT = config.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(httpLogger);
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({ success: true, message: "API Express opérationnelle" });
});

// Utilisation des routes
app.use("/users", userRouter);
app.use("/api/auth", authRouter); // Routes authentifiées
app.use("/", authRouter); // Routes register/login à la racine
app.use("/api/2fa", twoFactorRouter); // Routes 2FA (Personne 4)
app.use("/api/sessions", sessionsRouter);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Serveur démarré sur <http://localhost>:${PORT}`);
});
