import { tokenService } from '#services/token.service';
import prisma from '#lib/prisma';

export class OAuthController {
  static async googleCallback(req, res) {
    const tokens = tokenService.generateJWTs(req.user);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: req.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    return res.json(tokens);
  }
}