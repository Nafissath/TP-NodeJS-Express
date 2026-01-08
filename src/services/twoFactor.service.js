import speakeasy from "speakeasy";
import prisma from "#lib/prisma";
import { UnauthorizedException, NotFoundException } from "#lib/exceptions";
import { config } from "#config/env";

export class TwoFactorService {

    static async generateSecret(userId, userEmail) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException("Utilisateur introuvable");
        }

        if (user.twoFactorEnabledAt) {
            throw new UnauthorizedException("2FA déjà activé");
        }

        const secret = speakeasy.generateSecret({
            name: `TP-NodeJS (${userEmail})`,
            issuer: "TP-NodeJS",
            length: 20
        });

        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret.base32 },
        });

        return {
            secret: secret.base32
        };
    }

    static async verifyToken(userId, token, isActivation = false) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.twoFactorSecret) {
            throw new UnauthorizedException("2FA non configuré");
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: "base32",
            token: token,
            window: 2
        });

        if (!verified) return false;

        if (isActivation && !user.twoFactorEnabledAt) {
            await prisma.user.update({
                where: { id: userId },
                data: { twoFactorEnabledAt: new Date() },
            });
        }

        return true;
    }

    static async disable(userId, token) {
        const isValid = await this.verifyToken(userId, token, false);

        if (!isValid) {
            throw new UnauthorizedException("Code invalide");
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorSecret: null,
                twoFactorEnabledAt: null,
            },
        });
    }

    static async getStatus(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        return {
            enabled: !!user.twoFactorEnabledAt,
            enabledAt: user.twoFactorEnabledAt,
        };
    }
}
