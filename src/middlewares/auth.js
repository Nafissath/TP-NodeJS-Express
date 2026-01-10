import TokenService from '../services/token.service.js';
import prisma from '../lib/prisma.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Vérifier le token
    const decoded = await TokenService.verifyAccessToken(token);
    
    // Récupérer l'utilisateur (exclure les champs sensibles)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        emailVerifiedAt: true,
        twoFactorEnabledAt: true,
        disabledAt: true,
        provider: true,
        createdAt: true,
        updatedAt: true
      }

    const token = bearerToken.split(" ")[1];

    const payload = await verifyAccessToken(token);

    if (!payload) {
      throw new UnauthorizedException("Token expiré ou invalide");
    }


    const blacklisted = await prisma.blacklistedAccessToken.findUnique({
      where: { token: token }
    });
    
    if (!user || user.disabledAt) {
      return res.status(401).json({
        success: false,
        error: 'User not found or account disabled'
      });
    }
    
    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

export default authMiddleware;