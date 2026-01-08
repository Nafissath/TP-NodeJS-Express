import { rateLimit } from "express-rate-limit";

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limite chaque IP à 100 requêtes par fenêtre
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Trop de requêtes, veuillez réessayer plus tard.",
    },
});

export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 5, // 5 tentatives échouées max par heure
    skipSuccessfulRequests: true, // Si succès, on ne compte pas
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Trop de tentatives de connexion échouées. Votre IP est temporairement bloquée (1h).",
    },
});

export const securityLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Action de sécurité trop fréquente (changement MDP, sessions). Réessayez plus tard.",
    },
});
