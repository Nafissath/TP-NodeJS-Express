import nodemailer from "nodemailer";
import { config } from "#config/env";
import pino from "pino";

const logger = pino();

class EmailService {
    constructor() {
        // Configuration avec les variables d'environnement
        this.transporter = nodemailer.createTransport({
            host: config.SMTP_HOST || "smtp.ethereal.email",
            port: config.SMTP_PORT || 587,
            secure: config.SMTP_SECURE || false,
            auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASS,
            },
        });
        
        logger.info(`Email service configuré avec: ${config.SMTP_HOST}:${config.SMTP_PORT}`);
    }

    async sendEmail({ to, subject, html }) {
        try {
            // Si pas de config SMTP, on log juste dans la console
            if (!config.SMTP_USER) {
                logger.info(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
                logger.info(`[EMAIL CONTENT]: ${html}`);
                return { messageId: "mock-id" };
            }

            const info = await this.transporter.sendMail({
                from: `"${config.APP_NAME}" <${config.SMTP_FROM || 'no-reply@example.com'}>`,
                to,
                subject,
                html,
            });

            logger.info(`Email sent: ${info.messageId}`);
            return info;
        } catch (error) {
            logger.error(`Error sending email: ${error.message}`);
            throw error; // On propage l'erreur pour voir ce qui se passe
        }
    }

    async sendNewLoginAlert(email, details) {
        const { ip, userAgent, date } = details;
        await this.sendEmail({
            to: email,
            subject: "Nouvelle connexion détectée",
            html: `
        <h1>Nouvelle connexion à votre compte</h1>
        <p>Une nouvelle connexion a été détectée le ${date}.</p>
        <ul>
          <li><strong>IP:</strong> ${ip}</li>
          <li><strong>Appareil:</strong> ${userAgent}</li>
        </ul>
        <p>Si ce n'était pas vous, veuillez changer votre mot de passe immédiatement.</p>
      `,
        });
    }

    async sendPasswordChangeAlert(email) {
        await this.sendEmail({
            to: email,
            subject: "Votre mot de passe a été modifié",
            html: `
        <h1>Modification de mot de passe</h1>
        <p>Le mot de passe de votre compte a été modifié avec succès.</p>
        <p>Si vous n'êtes pas à l'origine de cette action, veuillez contacter le support.</p>
      `,
        });
    }

    async sendVerificationEmail(email, token) {
        const verificationUrl = `${config.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;
        
        await this.sendEmail({
            to: email,
            subject: "Vérifiez votre adresse email",
            html: `
        <h1>Bienvenue sur notre plateforme!</h1>
        <p>Merci de vous être inscrit. Pour finaliser votre compte, veuillez vérifier votre adresse email en cliquant sur le lien ci-dessous :</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Vérifier mon email</a>
        </div>
        <p>Ce lien expirera dans 24 heures.</p>
        <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
      `,
        });
    }

    async sendPasswordResetEmail(email, token) {
        const resetUrl = `${config.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
        
        await this.sendEmail({
            to: email,
            subject: "Réinitialisation de votre mot de passe",
            html: `
        <h1>Réinitialisation du mot de passe</h1>
        <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Réinitialiser mon mot de passe</a>
        </div>
        <p>Ce lien expirera dans 1 heure.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
      `,
        });
    }
}

export default new EmailService();
