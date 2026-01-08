import prisma from "#lib/prisma";
import { hashPassword, verifyPassword } from "#lib/password";
import { ConflictException, UnauthorizedException, NotFoundException } from "#lib/exceptions";
import EmailService from "#services/email.service";

// Configuration des champs à retourner 
const USER_SELECT_FIELDS = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  emailVerifiedAt: true,
  disabledAt: true,
  createdAt: true
};

export class UserService {
  // Inscription
  static async register(data) {
    const { email, password, firstName, lastName } = data;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException("Email déjà utilisé");

    const hashedPassword = await hashPassword(password);

    return prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName
      },
    });
  }

  // Connexion
  static async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password || !(await verifyPassword(user.password, password))) {
      throw new UnauthorizedException("Identifiants invalides");
    }
    return user; // Retourne l'user complet pour le controller (besoin de l'ID)
  }

  // GESTION DES SESSIONS (Whitelist)
  static async createRefreshToken(userId, token, expiresAt, ipAddress, userAgent) {
    return await prisma.refreshToken.create({
      data: { userId, token, expiresAt, ipAddress, userAgent }
    });
  }

  static async findAll() {
    return prisma.user.findMany();
  }

  static async revokeAllOtherSessions(userId, currentRefreshToken = null) {
    return prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(currentRefreshToken ? { NOT: { token: currentRefreshToken } } : {})
      },
      data: { revokedAt: new Date() }
    });
  }

  // LECTURE
  static async findAll() {
    return prisma.user.findMany({ select: USER_SELECT_FIELDS });
  }

  static async findById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: USER_SELECT_FIELDS
    });
    if (!user) throw new NotFoundException("Utilisateur non trouvé");
    return user;
  }

  static async update(userId, data) {
    if (data.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException("Cet email est déjà utilisé");
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data: data,
    });
  }

  static async updatePassword(userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      throw new ConflictException("Impossible de modifier le mot de passe (compte OAuth ?)");
    }

    const isValid = await verifyPassword(user.password, oldPassword);
    if (!isValid) {
      throw new UnauthorizedException("Ancien mot de passe incorrect");
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Notification de changement de mot de passe
    EmailService.sendPasswordChangeAlert(user.email);

    // Sécurité: Révoquer toutes les autres sessions lors d'un changement de MDP
    await this.revokeAllOtherSessions(userId);
  }

  static async softDelete(userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { disabledAt: new Date() },
    });

    // Sécurité: Révoquer absolument TOUTES les sessions lors d'une suppression
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  static async getLoginHistory(userId) {
    return prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async listSessions(userId) {
    return prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
        revokedAt: null
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  static async revokeSession(userId, tokenId) {
    // On ne supprime pas forcément, on peut juste révoquer (soft-revoke)
    return prisma.refreshToken.updateMany({
      where: { id: tokenId, userId },
      data: { revokedAt: new Date() }
    });
  }

  static async revokeAllOtherSessions(userId, currentRefreshToken = null) {
    return prisma.refreshToken.updateMany({
      where: {
        userId,
        token: { not: currentRefreshToken },
        revokedAt: null
      },
      data: { revokedAt: new Date() }
    });
  }
}
