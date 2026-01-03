import nodemailer from "nodemailer";
import { config } from "#config/env";
import pino from "pino";

const logger = pino();

class EmailService {
    constructor() {
        // Configuration pour le développement (Ethereal ou console)
        // En production, on utiliserait les vraies variables d'environnement
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.ethereal.email",
            port: process.env.SMTP_PORT || 587,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendEmail({ to, subject, html }) {
        try {
            // Si pas de config SMTP, on log juste dans la console
            if (!process.env.SMTP_USER) {
                logger.info(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
                logger.info(`[EMAIL CONTENT]: ${html}`);
                return { messageId: "mock-id" };
            }

            const info = await this.transporter.sendMail({
                from: '"Security TP" <security@example.com>',
                to,
                subject,
                html,
            });

            logger.info(`Email sent: ${info.messageId}`);
            return info;
        } catch (error) {
            logger.error(`Error sending email: ${error.message}`);
            // On ne bloque pas le flux principal si l'email échoue
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
}

export default new EmailService();
