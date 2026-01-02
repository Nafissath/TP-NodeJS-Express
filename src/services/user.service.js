import prisma from "#lib/prisma";
import { hashPassword, verifyPassword } from "#lib/password";
import { ConflictException, UnauthorizedException, NotFoundException } from "#lib/exceptions";

export class UserService {
  static async register(data) {
    const { email, password, firstName, lastName } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException("Email déjà utilisé");
    }

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

  static async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password || !(await verifyPassword(user.password, password))) {
      throw new UnauthorizedException("Identifiants invalides");
    }

    return user;
  }


  // Whitelist des Refresh Tokens 
  static async createRefreshToken(userId, token, expiresAt, ipAddress, userAgent) {
    return await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
        ipAddress,
        userAgent
      }
    });
  }

  static async findAll() {
    return prisma.user.findMany();
  }

  static async findById(id) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException("Utilisateur non trouvé");
    }

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
  }

  static async softDelete(userId) {
    return prisma.user.update({
      where: { id: userId },
      data: { disabledAt: new Date() },
    });
  }
}
