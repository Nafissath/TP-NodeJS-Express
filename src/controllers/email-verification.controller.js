import prisma from '#lib/prisma';
import { tokenService } from '#services/token.service';
import emailService from '#services/email.service';
import { asyncHandler } from '#lib/async-handler';
import { logger } from '#lib/logger';

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  try {
    const verificationToken = await tokenService.verifyEmailToken(token);
    
    // Marquer l'email comme vérifié
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerifiedAt: new Date() }
    });

    // Consommer le token
    await tokenService.consumeVerificationToken(verificationToken.id);

    logger.info(`Email vérifié pour l'utilisateur ${verificationToken.userId}`);

    res.json({
      success: true,
      message: 'Email vérifié avec succès'
    });
  } catch (error) {
    if (error.message === 'Token invalide' || error.message === 'Token expiré') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    throw error;
  }
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'L\'adresse email est requise'
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Aucun utilisateur trouvé avec cette adresse email'
      });
    }

    if (user.emailVerifiedAt) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà vérifié'
      });
    }

    // Créer un nouveau token de vérification
    const verificationToken = await tokenService.createVerificationToken(user.id);
    
    // Envoyer l'email de vérification
    await emailService.sendVerificationEmail(user.email, verificationToken.token);

    logger.info(`Email de vérification renvoyé à ${email}`);

    res.json({
      success: true,
      message: 'Email de vérification envoyé'
    });
  } catch (error) {
    logger.error('Erreur renvoi vérification email:', error);
    throw error;
  }
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'L\'adresse email est requise'
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Toujours retourner un succès pour éviter l'énumération d'emails
    if (!user) {
      return res.json({
        success: true,
        message: 'Si un compte existe avec cette adresse email, vous recevrez un email de réinitialisation'
      });
    }

    // Créer un token de réinitialisation
    const resetToken = await tokenService.createPasswordResetToken(user.id);
    
    // Envoyer l'email de réinitialisation
    await emailService.sendPasswordResetEmail(user.email, resetToken.token);

    logger.info(`Email de réinitialisation envoyé à ${email}`);

    res.json({
      success: true,
      message: 'Si un compte existe avec cette adresse email, vous recevrez un email de réinitialisation'
    });
  } catch (error) {
    logger.error('Erreur demande réinitialisation mot de passe:', error);
    throw error;
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Le nouveau mot de passe est requis'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Le mot de passe doit contenir au moins 8 caractères'
    });
  }

  try {
    const resetToken = await tokenService.verifyPasswordResetToken(token);
    
    // Hasher le nouveau mot de passe
    const { hashPassword } = await import('#lib/password');
    const hashedPassword = await hashPassword(password);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword }
    });

    // Consommer le token
    await tokenService.consumePasswordResetToken(resetToken.id);

    // Envoyer une notification de sécurité
    await emailService.sendPasswordChangeAlert(resetToken.user.email);

    logger.info(`Mot de passe réinitialisé pour l'utilisateur ${resetToken.userId}`);

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    if (error.message === 'Token invalide' || error.message === 'Token expiré') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    throw error;
  }
});

export const cleanupTokens = asyncHandler(async (req, res) => {
  try {
    const result = await tokenService.cleanupExpiredTokens();
    
    res.json({
      success: true,
      message: 'Nettoyage des tokens expirés effectué',
      data: result
    });
  } catch (error) {
    logger.error('Erreur nettoyage tokens:', error);
    throw error;
  }
});
