import { UserService } from "#services/user.service";
import { UserDto } from "#dto/user.dto";
import { signAccessToken, signRefreshToken } from "#lib/jwt";
import { validateData } from "#lib/validate";
import { registerSchema, loginSchema } from "#schemas/user.schema";

export class UserController {
  static async register(req, res, next) {
    try {
      const validatedData = validateData(registerSchema, req.body);
      const user = await UserService.register(validatedData);

      const accessToken = await signAccessToken({ userId: user.id });
      const refreshToken = await signRefreshToken({ userId: user.id });

      // Optionnel mais recommandé : Enregistrer la session dès l'inscription
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await UserService.createRefreshToken(user.id, refreshToken, expiresAt, req.ip, req.headers["user-agent"]);

      res.status(201).json({
        success: true,
        user: UserDto.transform(user),
        accessToken,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
  try {
    const validatedData = validateData(loginSchema, req.body);
    const { email, password } = validatedData;

    const user = await UserService.login(email, password);
    
    const accessToken = await signAccessToken({ userId: user.id });
    const refreshToken = await signRefreshToken({ userId: user.id });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

    await UserService.createRefreshToken(user.id, refreshToken, expiresAt, req.ip, req.headers["user-agent"]);

    res.json({
      success: true,
      user: UserDto.transform(user),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
}

  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await UserService.logout(refreshToken);
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
}
