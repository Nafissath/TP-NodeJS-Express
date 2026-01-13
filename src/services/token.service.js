import { randomBytes, createHash, createHmac } from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '#lib/prisma';
import { logger } from '#lib/logger';
import { config } from '#config/env';

class TokenService {
  generateJWTs(user) {
    // Règle Prof : Padding pour que le token dépasse 1024 octets
    const padding = randomBytes(550).toString('hex');

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, padding },
      config.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      config.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  generateMfaToken(userId) {
    return jwt.sign(
      { userId, type: 'mfa_pending' },
      config.ACCESS_TOKEN_SECRET,
      { expiresIn: '5m' }
    );
  }

  verifyMfaToken(token) {
    try {
      const payload = jwt.verify(token, config.ACCESS_TOKEN_SECRET);
      if (payload.type !== 'mfa_pending') return null;
      return payload;
    } catch {
      return null;
    }
  }

  generateToken() {
    return randomBytes(32).toString('hex');
  }

  // Génère un token signé pour les emails
  generateSecureToken(data) {
    const timestamp = Date.now().toString();
    const payload = `${data}:${timestamp}`;
    const signature = createHmac('sha256', config.EMAIL_TOKEN_SECRET)
      .update(payload)
      .digest('hex');
    return `${payload}:${signature}`;
  }

  // Vérifie un token signé
  verifySecureToken(token) {
    const [data, timestamp, signature] = token.split(':');
    const payload = `${data}:${timestamp}`;
    const expectedSignature = createHmac('sha256', config.EMAIL_TOKEN_SECRET)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Token invalide - signature incorrecte');
    }

    return { data, timestamp: parseInt(timestamp) };
  }

  // --- Les méthodes Prisma restent identiques ---
  async createVerificationToken(userId) {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      await prisma.verificationToken.deleteMany({ where: { userId } });
      const verificationToken = await prisma.verificationToken.create({
        data: { token, userId, expiresAt }
      });
      logger.info(`Token de vérification créé pour l'utilisateur ${userId}`);
      return verificationToken;
    } catch (error) {
      logger.error('Erreur création token de vérification:', error);
      throw new Error('Impossible de créer le token de vérification');
    }
  }

  async createPasswordResetToken(userId) {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    try {
      await prisma.passwordResetToken.deleteMany({ where: { userId } });
      const resetToken = await prisma.passwordResetToken.create({
        data: { token, userId, expiresAt }
      });
      logger.info(`Token de réinitialisation créé pour l'utilisateur ${userId}`);
      return resetToken;
    } catch (error) {
      logger.error('Erreur création token de réinitialisation:', error);
      throw new Error('Impossible de créer le token de réinitialisation');
    }
  }

  async verifyEmailToken(token) {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true }
    });
    if (!verificationToken) throw new Error('Token invalide');
    if (verificationToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { id: verificationToken.id } });
      throw new Error('Token expiré');
    }
    return verificationToken;
  }

  async verifyPasswordResetToken(token) {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });
    if (!resetToken) throw new Error('Token invalide');
    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      throw new Error('Token expiré');
    }
    return resetToken;
  }

  async consumeVerificationToken(tokenId) {
    await prisma.verificationToken.delete({ where: { id: tokenId } });
  }

  async consumePasswordResetToken(tokenId) {
    await prisma.passwordResetToken.delete({ where: { id: tokenId } });
  }

  async cleanupExpiredTokens() {
    const now = new Date();
    const delVerif = await prisma.verificationToken.deleteMany({ where: { expiresAt: { lt: now } } });
    const delReset = await prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } });
    const delBlacklist = await prisma.blacklistedAccessToken.deleteMany({ where: { expiresAt: { lt: now } } });
    return {
      verificationTokensDeleted: delVerif.count,
      resetTokensDeleted: delReset.count,
      blacklistedTokensDeleted: delBlacklist.count
    };
  }
}

export const tokenService = new TokenService();