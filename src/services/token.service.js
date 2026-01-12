import { randomBytes } from 'crypto';
import prisma from '#lib/prisma';
import { logger } from '#lib/logger';
import { config } from '#config/env';
import { createHash, createHmac, randomBytes } from 'crypto';
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
  generateToken() {
    return randomBytes(32).toString('hex');
  }

  // Génère un token signé avec le secret séparé pour les emails
  generateSecureToken(data) {
    const timestamp = Date.now().toString();
    const payload = `${data}:${timestamp}`;
    const signature = hmac('sha256', config.EMAIL_TOKEN_SECRET, payload).toString('hex');
    return `${payload}:${signature}`;
  }

  // Vérifie un token signé
  verifySecureToken(token) {
    const [data, timestamp, signature] = token.split(':');
    const expectedSignature = hmac('sha256', config.EMAIL_TOKEN_SECRET, `${data}:${timestamp}`).toString('hex');
    
    if (signature !== expectedSignature) {
      throw new Error('Token invalide - signature incorrecte');
    }
    
    return { data, timestamp: parseInt(timestamp) };
  }

  async createVerificationToken(userId) {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    try {
      // Supprimer les anciens tokens de vérification pour cet utilisateur
      await prisma.verificationToken.deleteMany({
        where: { userId }
      });

      const verificationToken = await prisma.verificationToken.create({
        data: {
          token,
          userId,
          expiresAt
        }
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
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    try {
      // Supprimer les anciens tokens de réinitialisation pour cet utilisateur
      await prisma.passwordResetToken.deleteMany({
        where: { userId }
      });

      const resetToken = await prisma.passwordResetToken.create({
        data: {
          token,
          userId,
          expiresAt
        }
      });

      logger.info(`Token de réinitialisation créé pour l'utilisateur ${userId}`);
      return resetToken;
    } catch (error) {
      logger.error('Erreur création token de réinitialisation:', error);
      throw new Error('Impossible de créer le token de réinitialisation');
    }
  }

  async verifyEmailToken(token) {
    try {
      const verificationToken = await prisma.verificationToken.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!verificationToken) {
        throw new Error('Token invalide');
      }

      if (verificationToken.expiresAt < new Date()) {
        await prisma.verificationToken.delete({
          where: { id: verificationToken.id }
        });
        throw new Error('Token expiré');
      }

      return verificationToken;
    } catch (error) {
      logger.error('Erreur vérification token email:', error);
      throw error;
    }
  }

  async verifyPasswordResetToken(token) {
    try {
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!resetToken) {
        throw new Error('Token invalide');
      }

      if (resetToken.expiresAt < new Date()) {
        await prisma.passwordResetToken.delete({
          where: { id: resetToken.id }
        });
        throw new Error('Token expiré');
      }

      return resetToken;
    } catch (error) {
      logger.error('Erreur vérification token de réinitialisation:', error);
      throw error;
    }
  }

  async consumeVerificationToken(tokenId) {
    try {
      await prisma.verificationToken.delete({
        where: { id: tokenId }
      });
      logger.info(`Token de vérification consommé: ${tokenId}`);
    } catch (error) {
      logger.error('Erreur consommation token de vérification:', error);
      throw new Error('Impossible de consommer le token de vérification');
    }
  }

  async consumePasswordResetToken(tokenId) {
    try {
      await prisma.passwordResetToken.delete({
        where: { id: tokenId }
      });
      logger.info(`Token de réinitialisation consommé: ${tokenId}`);
    } catch (error) {
      logger.error('Erreur consommation token de réinitialisation:', error);
      throw new Error('Impossible de consommer le token de réinitialisation');
    }
  }

  async cleanupExpiredTokens() {
    try {
      const now = new Date();
      
      const deletedVerificationTokens = await prisma.verificationToken.deleteMany({
        where: {
          expiresAt: {
            lt: now
          }
        }
      });

      const deletedResetTokens = await prisma.passwordResetToken.deleteMany({
        where: {
          expiresAt: {
            lt: now
          }
        }
      });

      logger.info(`Nettoyage tokens: ${deletedVerificationTokens.count} tokens de vérification supprimés, ${deletedResetTokens.count} tokens de réinitialisation supprimés`);
      
      return {
        verificationTokensDeleted: deletedVerificationTokens.count,
        resetTokensDeleted: deletedResetTokens.count
      };
    } catch (error) {
      logger.error('Erreur nettoyage tokens expirés:', error);
      throw new Error('Impossible de nettoyer les tokens expirés');
    }
  }
}

export const tokenService = new TokenService();
