import prisma from "#lib/prisma";
import { hashPassword, verifyPassword } from "#lib/password";
import { ConflictException, UnauthorizedException, NotFoundException } from "#lib/exceptions";

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
      data: { email, password: hashedPassword, firstName, lastName },
      select: USER_SELECT_FIELDS
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

  static async logout(token) {
    return prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() }
    });
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
}
