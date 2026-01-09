import TokenService from '../services/token.service.js';

class RefreshController {
  /**
   * POST /api/auth/refresh
   * Route CRITIQUE pour le maintien de session
   */
  static async refreshTokens(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        });
      }
      
      console.log(`🔄 Refresh request from ${req.ip}`);
      
      // Vérifier et tourner le refresh token
      const result = await TokenService.verifyAndRotateRefreshToken(refreshToken, req);
      
      // Blacklist l'ancien access token si fourni
      const oldAccessToken = req.headers.authorization?.replace('Bearer ', '');
      if (oldAccessToken && oldAccessToken !== 'null') {
        await TokenService.blacklistAccessToken(
          oldAccessToken, 
          result.user.id, 
          'refresh_rotation'
        );
      }
      
      // Retourner les nouveaux tokens
      return res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            avatar: result.user.avatar,
            emailVerified: !!result.user.emailVerifiedAt,
            twoFactorEnabled: !!result.user.twoFactorEnabledAt
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Refresh error:', error.message);
      
      let statusCode = 401;
      let errorMessage = 'Invalid refresh token';
      
      if (error.message.includes('not found')) {
        errorMessage = 'Refresh token not found';
      } else if (error.message.includes('revoked')) {
        errorMessage = 'Refresh token has been revoked';
      } else if (error.message.includes('expired')) {
        errorMessage = 'Refresh token has expired';
      } else if (error.message.includes('1024')) {
        statusCode = 500;
        errorMessage = 'Token generation error';
      }
      
      return res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  }
  
  /**
   * GET /api/auth/refresh/test
   * Test la taille des tokens
   */
  static async testTokenSize(req, res) {
    try {
      const testUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      };
      
      const tokens = await TokenService.generateTokens(testUser);
      const size = Buffer.byteLength(tokens.accessToken, 'utf8');
      
      return res.json({
        success: true,
        data: {
          tokenSize: size,
          meetsRequirement: size >= 1024,
          message: size >= 1024 
            ? `✅ Token size OK: ${size} bytes (≥1024)`
            : `❌ Token too small: ${size} bytes (<1024)`,
          requirement: "Tokens must be at least 1024 bytes",
          tokenPreview: tokens.accessToken.substring(0, 150) + '...'
        }
      });
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default RefreshController;