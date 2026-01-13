import prisma from '#lib/prisma';
import { tokenService } from '#services/token.service';
import jwt from 'jsonwebtoken';
import { config } from '#config/env';

export class RefreshController {
  static async refresh(req, res) {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "Token manquant" });

    const storedToken = await prisma.refreshToken.findFirst({
      where: { token: refreshToken, revokedAt: null }
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ message: "Session expirée ou invalide" });
    }

    // Invalidation immédiate (Règle Prof)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() }
    });

    try {
      const decoded = jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET);
      const user = await prisma.user.findUnique({ where: { id: decoded.userId} });
      const tokens = tokenService.generateJWTs(user);

      await prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      return res.json(tokens);
    } catch (err) {
      return res.status(403).json({ message: "Token invalide" });
    }
  }
}