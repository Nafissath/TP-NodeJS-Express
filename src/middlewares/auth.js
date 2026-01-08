import { UnauthorizedException } from "#lib/exceptions";
import { verifyAccessToken } from "#lib/jwt";
import { logger } from "#lib/logger";
import prisma from "#lib/prisma";

export async function auth(req, res, next) {
  try {
    const bearerToken = req.headers["authorization"];

    if (!bearerToken || !bearerToken.startsWith("Bearer ")) {
      throw new UnauthorizedException("Format de token invalide");
    }

    const token = bearerToken.split(" ")[1];

    const payload = await verifyToken(token);

    if (!payload) {
      throw new UnauthorizedException("Token expiré ou invalide");
    }


    const blacklisted = await prisma.blacklistedAccessToken.findUnique({
      where: { token: token }
    });
    if (blacklisted) {
      throw new UnauthorizedException("Session expirée (déconnectée)");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user) throw new UnauthorizedException("Utilisateur inexistant");
    if (user.disabledAt) throw new UnauthorizedException("Compte désactivé");
    req.user = {
      userId: payload.userId,
      exp: payload.exp
    };


    logger.info(`Utilisateur ${req.user.userId} authentifié`);
    next();
  } catch (error) {

    next(error);
  }
}