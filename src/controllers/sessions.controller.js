import prisma from '#lib/prisma';

export class SessionsController {
  static async getActiveSessions(req, res) {
    const sessions = await prisma.refreshToken.findMany({
      where: { userId: req.user.id, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, ipAddress: true, userAgent: true, createdAt: true }
    });
    return res.json({ success: true, data: sessions });
  }

  static async revokeOtherSessions(req, res) {
    const currentToken = req.body.refreshToken || req.cookies.refreshToken;

    const result = await prisma.refreshToken.updateMany({
      where: { userId: req.user.id, revokedAt: null, token: { not: currentToken } },
      data: { revokedAt: new Date() }
    });

    return res.json({ success: true, message: `${result.count} sessions révoquées.` });
  }
}