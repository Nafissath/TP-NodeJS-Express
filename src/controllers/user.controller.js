import { UserService } from "#services/user.service";
import { UserDto } from "#dto/user.dto";
import { signAccessToken, signRefreshToken } from "#lib/jwt";
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from "#schemas/user.schema";
import { validateData } from "#lib/validate";
import prisma from "#lib/prisma";

export class UserController {
  static async register(req, res) {
    const validatedData = validateData(registerSchema, req.body);
    const user = await UserService.register(validatedData);

    res.status(201).json({
      success: true,
      user: UserDto.transform(user),
      message: "Compte créé. Veuillez vous connecter.",
    });
  }

  static async login(req, res) {
    const validatedData = validateData(loginSchema, req.body);
    const { email, password } = validatedData;

    const user = await UserService.login(email, password);

    const accessToken = await signAccessToken({ userId: user.id });
    const refreshToken = await signRefreshToken({ userId: user.id });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);


    // Permet la gestion des sessions(Whitelist)
    await UserService.createRefreshToken(
      user.id,
      refreshToken,
      expiresAt,
      req.ip,
      req.headers["user-agent"]
    );

    // Historique de connexion
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"] || "unknown",
        success: true
      }
    });

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: UserDto.transform(user),

    });
  }


  // Blacklist l'accessToken actuel
  static async logout(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(204).end();
    }

    const token = authHeader.split(" ")[1];
    const { refreshToken } = req.body;

    // 1. Blacklister l'access token 
    await prisma.blacklistedAccessToken.create({
      data: {
        token: token,
        userId: req.user.userId,
        expiresAt: new Date(req.user.exp * 1000)
      }
    });

    // 2. Révoquer le refresh token
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId: req.user.userId },
        data: { revokedAt: new Date() }
      });
    }

    res.json({ success: true, message: "Déconnexion réussie" });
  }


  static async getAll(req, res) {
    const users = await UserService.findAll();
    res.json({
      success: true,
      users: users.map(user => UserDto.transform(user)),
    });
  }

  static async getById(req, res) {
    const user = await UserService.findById(req.params.id);
    res.json({
      success: true,
      user: UserDto.transform(user),
    });
  }

  static async getMe(req, res) {
    const user = await UserService.findById(req.user.userId);
    res.json({
      success: true,
      user: UserDto.transform(user),
    });
  }

  static async updateMe(req, res) {
    const validatedData = validateData(updateProfileSchema, req.body);
    const user = await UserService.update(req.user.userId, validatedData);

    res.json({
      success: true,
      user: UserDto.transform(user),
      message: "Profil mis à jour avec succès",
    });
  }

  static async changePassword(req, res) {
    const { oldPassword, newPassword } = validateData(changePasswordSchema, req.body);
    await UserService.updatePassword(req.user.userId, oldPassword, newPassword);

    res.json({
      success: true,
      message: "Mot de passe modifié avec succès",
    });
  }

  static async deleteMe(req, res) {
    await UserService.softDelete(req.user.userId);
    res.json({
      success: true,
      message: "Votre compte a été désactivé avec succès",
    });
  }
}
