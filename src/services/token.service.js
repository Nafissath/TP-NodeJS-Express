import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';

class TokenService {
  /**
   * Génère des tokens JWT avec padding pour atteindre 1024+ octets
   * CRITIQUE pour les exigences du professeur
   */
  static async generateTokens(user) {
    // Vérifier que les secrets existent
    if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
      throw new Error('JWT secrets are not configured');
    }
    
    // Vérifier la longueur des secrets (256 caractères minimum)
    if (process.env.ACCESS_TOKEN_SECRET.length < 256 || 
        process.env.REFRESH_TOKEN_SECRET.length < 256) {
      console.warn('⚠️  Warning: JWT secrets should be at least 256 characters');
    }
    
    // Calcul dynamique du padding pour atteindre 1024 octets
    let accessTokenSize = 0;
    let paddingSize = 700; // Commence avec 700 bytes de padding
    let finalAccessToken = '';
    
    // Essayer jusqu'à atteindre 1024 octets
    for (let attempt = 0; attempt < 5; attempt++) {
      const padding = crypto.randomBytes(paddingSize).toString('base64');
      
      const accessTokenPayload = {
        userId: user.id,
        email: user.email,
        name: user.name || '',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
        // CHAMP PADDING POUR ATTEINDRE 1024 OCTETS
        _p: padding
      };
      
      const token = jwt.sign(
        accessTokenPayload,
        process.env.ACCESS_TOKEN_SECRET
      );
      
      accessTokenSize = Buffer.byteLength(token, 'utf8');
      
      if (accessTokenSize >= 1024) {
        finalAccessToken = token;
        break;
      }
      
      // Augmenter le padding pour la prochaine tentative
      paddingSize += 100;
    }
    
    if (!finalAccessToken) {
      throw new Error(`Failed to generate token of 1024+ bytes. Last size: ${accessTokenSize} bytes`);
    }
    
    // Générer le refresh token (pas besoin de padding)
    const refreshToken = jwt.sign(
      {
        userId: user.id,
        tokenId: crypto.randomBytes(32).toString('hex'),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 jours
      },
      process.env.REFRESH_TOKEN_SECRET
    );
    
    console.log(`✅ Token generation - Size: ${accessTokenSize} bytes (${accessTokenSize >= 1024 ? 'PASS' : 'FAIL'})`);
    
    return {
      accessToken: finalAccessToken,
      refreshToken,
      tokenSize: accessTokenSize
    };
  }
  
  /**
   * Sauvegarde un refresh token en base de données
   */
  static async saveRefreshToken(userId, refreshToken, metadata = {}) {
    return await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
        deviceInfo: this.extractDeviceInfo(metadata.userAgent),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
      }
    });
  }
  
  /**
   * Vérifie et tourne un refresh token (rotation)
   */
  static async verifyAndRotateRefreshToken(oldRefreshToken, req) {
    // 1. Vérifier le token en base
    const tokenDoc = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
      include: { user: true }
    });
    
    if (!tokenDoc) {
      throw new Error('Refresh token not found');
    }
    
    if (tokenDoc.revokedAt) {
      throw new Error('Refresh token has been revoked');
    }
    
    if (tokenDoc.expiresAt < new Date()) {
      throw new Error('Refresh token has expired');
    }
    
    // 2. Marquer l'ancien comme révoqué
    await prisma.refreshToken.update({
      where: { id: tokenDoc.id },
      data: {
        revokedAt: new Date(),
        revokedReason: 'refresh_rotation',
        updatedAt: new Date()
      }
    });
    
    // 3. Générer de nouveaux tokens
    const newTokens = await this.generateTokens(tokenDoc.user);
    
    // 4. Sauvegarder le nouveau refresh token
    const newTokenDoc = await this.saveRefreshToken(
      tokenDoc.userId, 
      newTokens.refreshToken, 
      {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    );
    
    // 5. Lier l'ancien token au nouveau
    await prisma.refreshToken.update({
      where: { id: newTokenDoc.id },
      data: { previousToken: tokenDoc.id }
    });
    
    return {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      user: tokenDoc.user
    };
  }
  
  /**
   * Vérifie un access token
   */
  static async verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      
      // Vérifier si le token est blacklisté
      const blacklisted = await prisma.blacklistedAccessToken.findUnique({
        where: { token }
      });
      
      if (blacklisted) {
        throw new Error('Token has been blacklisted');
      }
      
      return decoded;
    } catch (error) {
      throw new Error(`Invalid access token: ${error.message}`);
    }
  }
  
  /**
   * Blacklist un access token
   */
  static async blacklistAccessToken(token, userId, reason = 'logout') {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      
      return await prisma.blacklistedAccessToken.create({
        data: {
          token,
          userId,
          expiresAt: new Date(decoded.exp * 1000),
          reason
        }
      });
    } catch (error) {
      // Token invalide, pas besoin de le blacklister
      return null;
    }
  }
  
  /**
   * Extrait les informations de l'appareil
   */
  static extractDeviceInfo(userAgent) {
    if (!userAgent) return {};
    
    const ua = userAgent.toLowerCase();
    return {
      isMobile: /mobile|android|iphone|ipad|ipod/i.test(ua),
      browser: this.detectBrowser(ua),
      os: this.detectOS(ua),
      raw: userAgent.substring(0, 200)
    };
  }
  
  static detectBrowser(ua) {
    if (/chrome/i.test(ua)) return 'Chrome';
    if (/firefox/i.test(ua)) return 'Firefox';
    if (/safari/i.test(ua)) return 'Safari';
    if (/edge/i.test(ua)) return 'Edge';
    return 'Unknown';
  }
  
  static detectOS(ua) {
    if (/windows/i.test(ua)) return 'Windows';
    if (/mac os/i.test(ua)) return 'MacOS';
    if (/linux/i.test(ua)) return 'Linux';
    if (/android/i.test(ua)) return 'Android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
    return 'Unknown';
  }
  
  /**
   * TEST : Vérifie que les tokens font 1024+ octets
   */
  static async testTokenSize() {
    const testUser = { 
      id: 'test-user-id', 
      email: 'test@example.com',
      name: 'Test User'
    };
    
    const tokens = await this.generateTokens(testUser);
    const size = Buffer.byteLength(tokens.accessToken, 'utf8');
    
    return {
      size,
      meetsRequirement: size >= 1024,
      message: size >= 1024 
        ? `✅ Token size OK: ${size} bytes (≥1024)`
        : `❌ Token too small: ${size} bytes (<1024)`,
      tokenPreview: tokens.accessToken.substring(0, 100) + '...'
    };
  }
}

export default TokenService;
// Vérification dans token.service.js
const tokenSize = Buffer.byteLength(token, 'utf8');
console.log(tokenSize >= 1024 ? "✅ PASS" : "❌ FAIL");