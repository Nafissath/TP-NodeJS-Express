import { UserService } from "#services/user.service";
import { UserDto } from "#dto/user.dto";
import { signAccessToken, signRefreshToken } from "#lib/jwt";
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from "#schemas/user.schema";
import { validateData } from "#lib/validate";
import prisma from "#lib/prisma";
import EmailService from "#services/email.service";
import { tokenService } from "#services/token.service";

export class UserController {
  static async register(req, res) {
    const validatedData = validateData(registerSchema, req.body);
    const user = await UserService.register(validatedData);

    // Envoyer l'email de vérification après l'inscription
    try {
      const token = await tokenService.createVerificationToken(user.id);
      await EmailService.sendVerificationEmail(user.email, token.token);
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email de vérification:", error);
      // On continue même si l'email échoue
    }

    res.status(201).json({
      success: true,
      user: UserDto.transform(user),
      message: "Compte créé. Un email de vérification a été envoyé à votre adresse.",
    });
  }

  static async login(req, res) {
    const validatedData = validateData(loginSchema, req.body);
    const { email, password } = validatedData;

    try {
      const user = await UserService.login(email, password);

      // Vérifier si l'email est vérifié
      if (!user.emailVerified) {
        return res.status(403).json({
          success: false,
          message: "Veuillez vérifier votre email avant de vous connecter",
          code: "EMAIL_NOT_VERIFIED"
        });
      }

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

      // Historique de connexion (Succès)
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

      // Notification de connexion
      EmailService.sendNewLoginAlert(user.email, {
        ip: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"] || "unknown",
        date: new Date().toLocaleString(),
      });
    } catch (error) {
      // Si l'utilisateur existe mais le MDP est faux, on log l'échec
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.loginHistory.create({
          data: {
            userId: user.id,
            ipAddress: req.ip || "127.0.0.1",
            userAgent: req.headers["user-agent"] || "unknown",
            success: false
          }
        });
      }
      throw error; // On laisse le gestionnaire d'erreurs global répondre 401
    }
  }

      await UserService.createRefreshToken(user.id, refreshToken, expiresAt, req.ip, req.headers["user-agent"]);

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
      res.json({ success: true, message: "Déconnecté" });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const users = await UserService.findAll();
      res.json({ success: true, users: UserDto.transform(users) });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      // Suppression du parseInt car tes IDs sont des UUID (Strings)
      const user = await UserService.findById(req.params.id);
      res.json({ success: true, user: UserDto.transform(user) });
    } catch (error) {
      next(error);
    }
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

  static async getLoginHistory(req, res) {
    const history = await UserService.getLoginHistory(req.user.userId);
    res.json({
      success: true,
      history,
    });
  }

  static async getSessions(req, res) {
    const sessions = await UserService.listSessions(req.user.userId);
    res.json({
      success: true,
      sessions,
    });
  }

  static async revokeSession(req, res) {
    await UserService.revokeSession(req.user.userId, req.params.id);
    res.json({
      success: true,
      message: "Session révoquée avec succès",
    });
  }

  static async revokeOtherSessions(req, res) {
    // On récupère le refresh token actuel depuis le body si possible (dépend de comment il est passé)
    // Pour simplifier ici, on révoque tout ce qui n'est pas révoqué
    await UserService.revokeAllOtherSessions(req.user.userId);
    res.json({
      success: true,
      message: "Toutes les autres sessions ont été révoquées",
    });
  }
}
