import { UnauthorizedException } from "#lib/exceptions";
import { verifyAccessToken } from "#lib/jwt";
import { logger } from "#lib/logger";
import prisma from "#lib/prisma";

export async function auth(req, res, next) {
    try {
        const authHeader = req.headers["authorization"];

        // 1. Vérification du format Bearer (Exigence Prof)
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Format de token invalide");
        }

        const token = authHeader.split(" ")[1];

        // 2. Vérification du JWT avec le secret de 256 caractères (via jose)
        const payload = await verifyAccessToken(token);

        if (!payload) {
            throw new UnauthorizedException("Token expiré ou invalide");
        }

        // 3. Vérification de la Blacklist (Pour le Logout de P1)
        const blacklisted = await prisma.blacklistedAccessToken.findUnique({
            where: { token: token }
        });

        if (blacklisted) {
            throw new UnauthorizedException("Session expirée (déconnectée)");
        }

        // 4. Récupération de l'utilisateur (sans le password grâce à select)
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, disabledAt: true }
        });

        if (!user) throw new UnauthorizedException("Utilisateur inexistant");
        if (user.disabledAt) throw new UnauthorizedException("Compte désactivé");

        // 5. On attache l'utilisateur à la requête pour les autres (P3, P5...)
        req.user = {
            id: user.id,
            email: payload.email
        };

        logger.info(`Utilisateur ${req.user.id} authentifié`);
        next();
    } catch (error) {
        next(error);
    }
}