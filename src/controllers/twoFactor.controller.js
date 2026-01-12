import { TwoFactorService } from "#services/twoFactor.service";
import { asyncHandler } from "#lib/async-handler";
import { UnauthorizedException } from "#lib/exceptions";
import { z } from "zod";
import { validateData } from "#lib/validate";

const tokenSchema = z.object({
    token: z.string().length(6),
});

export class TwoFactorController {

    static async setup(req, res) {
        const prisma = (await import("#lib/prisma")).default;
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { email: true },
        });

        const result = await TwoFactorService.generateSecret(req.user.userId, user.email);

        res.json({
            success: true,
            message: "Secret généré",
            secret: result.secret
        });
    }

    static async enable(req, res) {
        const { token } = validateData(tokenSchema, req.body);
        const isValid = await TwoFactorService.verifyToken(req.user.userId, token, true);

        if (!isValid) throw new UnauthorizedException("Code invalide");

        res.json({ success: true, message: "2FA activé" });
    }

    static async verify(req, res) {
        const { token } = validateData(tokenSchema, req.body);
        const isValid = await TwoFactorService.verifyToken(req.user.userId, token, false);

        if (!isValid) throw new UnauthorizedException("Code invalide");

        res.json({ success: true, message: "Code valide" });
    }

    static async disable(req, res) {
        const { token } = validateData(tokenSchema, req.body);
        await TwoFactorService.disable(req.user.userId, token);
        res.json({ success: true, message: "2FA désactivé" });
    }

    static async status(req, res) {
        const status = await TwoFactorService.getStatus(req.user.userId);
        res.json({ success: true, data: status });
    }
}
