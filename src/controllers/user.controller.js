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
    try {
      const validatedData = validateData(registerSchema, req.body);
      const user = await UserService.register(validatedData);

      try {
        const token = await tokenService.createVerificationToken(user.id);
        await EmailService.sendVerificationEmail(user.email, token.token);
      } catch (error) {
        console.error("Erreur lors de l'envoi de l'email de vérification:", error);
      }

      res.status(201).json({
        success: true,
        user: UserDto.transform(user),
        message: "Compte créé. Un email de vérification a été envoyé à votre adresse.",
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async login(req, res) {
    try {
      const validatedData = validateData(loginSchema, req.body);
      const { email, password } = validatedData;

      const user = await UserService.login(email, password);
      
      // Vérifier si l'email est vérifié
      if (!user.emailVerifiedAt) {
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

      await UserService.createRefreshToken(user.id, refreshToken, expiresAt, req.ip, req.headers["user-agent"]);

      res.json({
        success: true,
        user: UserDto.transform(user),
        accessToken,
        refreshToken,
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

  static async logout(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(204).end();

      const token = authHeader.split(" ")[1];
      const { refreshToken } = req.body;

      await prisma.blacklistedAccessToken.create({
        data: {
          token: token,
          userId: req.user.userId,
          expiresAt: new Date(req.user.exp * 1000)
        }
      });

      if (refreshToken) {
        await UserService.logout(refreshToken);
      }

      res.json({ success: true, message: "Déconnecté" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const users = await UserService.findAll();
      res.json({ success: true, users: UserDto.transform(users) });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const user = await UserService.findById(req.params.id);
      res.json({ success: true, user: UserDto.transform(user) });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  static async getMe(req, res) {
    try {
      const user = await UserService.findById(req.user.userId);
      res.json({ success: true, user: UserDto.transform(user) });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  static async updateMe(req, res) {
    try {
      const validatedData = validateData(updateProfileSchema, req.body);
      const user = await UserService.update(req.user.userId, validatedData);
      res.json({ success: true, user: UserDto.transform(user), message: "Profil mis à jour" });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = validateData(changePasswordSchema, req.body);
      await UserService.updatePassword(req.user.userId, oldPassword, newPassword);
      res.json({ success: true, message: "Mot de passe modifié avec succès" });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async deleteMe(req, res) {
    try {
      await UserService.softDelete(req.user.userId);
      res.json({ success: true, message: "Compte désactivé" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getLoginHistory(req, res) {
    try {
      const history = await UserService.getLoginHistory(req.user.userId);
      res.json({ success: true, history });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getSessions(req, res) {
    try {
      const sessions = await UserService.listSessions(req.user.userId);
      res.json({ success: true, sessions });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async revokeSession(req, res) {
    try {
      await UserService.revokeSession(req.user.userId, req.params.id);
      res.json({ success: true, message: "Session révoquée" });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async revokeOtherSessions(req, res) {
    try {
      await UserService.revokeAllOtherSessions(req.user.userId);
      res.json({ success: true, message: "Autres sessions révoquées" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}