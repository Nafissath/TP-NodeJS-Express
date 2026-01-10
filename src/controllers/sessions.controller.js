import prisma from '../lib/prisma.js';

class SessionsController {
  /**
   * GET /api/auth/sessions
   * Liste toutes les sessions actives
   */
  static async listSessions(req, res) {
    try {
      const userId = req.user.id;
      const currentToken = req.cookies?.refresh_token || req.body.currentRefreshToken;
      
      const sessions = await prisma.refreshToken.findMany({
        where: {
          userId,
          revokedAt: null,
          expiresAt: { gt: new Date() }
        },
        orderBy: { lastUsedAt: 'desc' },
        select: {
          id: true,
          token: true,
          userAgent: true,
          ipAddress: true,
          deviceInfo: true,
          createdAt: true,
          expiresAt: true,
          lastUsedAt: true
        }
      });
      
      const formattedSessions = sessions.map(session => ({
        id: session.id,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        expiresAt: session.expiresAt,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        deviceInfo: session.deviceInfo,
        isCurrent: session.token === currentToken,
        status: this.getSessionStatus(session)
      }));
      
      return res.json({
        success: true,
        data: {
          sessions: formattedSessions,
          total: formattedSessions.length,
          currentSession: formattedSessions.find(s => s.isCurrent) || null
        }
      });
      
    } catch (error) {
      console.error('❌ List sessions error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch sessions'
      });
    }
  }
  
  /**
   * DELETE /api/auth/sessions/:id
   * Révoque une session spécifique
   */
  static async revokeSession(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const session = await prisma.refreshToken.findFirst({
        where: {
          id,
          userId,
          revokedAt: null
        }
      });
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found or already revoked'
        });
      }
      
      // Révoquer la session
      await prisma.refreshToken.update({
        where: { id },
        data: {
          revokedAt: new Date(),
          revokedReason: 'manual_revocation'
        }
      });
      
      console.log(`✅ Session ${id} revoked for user ${userId}`);
      
      return res.json({
        success: true,
        message: 'Session revoked successfully',
        data: {
          sessionId: id,
          revokedAt: new Date()
        }
      });
      
    } catch (error) {
      console.error('❌ Revoke session error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to revoke session'
      });
    }
  }
  
  /**
   * POST /api/auth/sessions/revoke-others
   * Révoque toutes les autres sessions
   */
  static async revokeOtherSessions(req, res) {
    try {
      const userId = req.user.id;
      const currentToken = req.cookies?.refresh_token || req.body.currentRefreshToken;
      
      if (!currentToken) {
        return res.status(400).json({
          success: false,
          error: 'Current session token is required'
        });
      }
      
      const result = await prisma.refreshToken.updateMany({
        where: {
          userId,
          token: { not: currentToken },
          revokedAt: null,
          expiresAt: { gt: new Date() }
        },
        data: {
          revokedAt: new Date(),
          revokedReason: 'revoke_others'
        }
      });
      
      console.log(`✅ ${result.count} other sessions revoked for user ${userId}`);
      
      return res.json({
        success: true,
        message: `${result.count} other session(s) revoked`,
        data: {
          revokedCount: result.count,
          currentSessionPreserved: true
        }
      });
      
    } catch (error) {
      console.error('❌ Revoke other sessions error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to revoke other sessions'
      });
    }
  }
  
  /**
   * Méthode pour Personne 5 : Invalide toutes les sessions
   */
  static async invalidateAllUserSessions(userId, reason = 'password_change') {
    try {
      const result = await prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
          expiresAt: { gt: new Date() }
        },
        data: {
          revokedAt: new Date(),
          revokedReason: reason
        }
      });
      
      console.log(`🔐 ${result.count} sessions invalidated for user ${userId} (reason: ${reason})`);
      return result.count;
      
    } catch (error) {
      console.error('Invalidate sessions error:', error);
      throw error;
    }
  }
  
  /**
   * Détermine le statut d'une session
   */
  static getSessionStatus(session) {
    if (session.expiresAt < new Date()) {
      return 'expired';
    }
    return 'active';
  }
}

export default SessionsController;