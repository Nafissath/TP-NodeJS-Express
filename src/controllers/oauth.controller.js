import passport from 'passport';
import TokenService from '../services/token.service.js';
import prisma from '../lib/prisma.js';

class OAuthController {
  /**
   * Middleware pour initier l'OAuth
   */
  static initiateOAuth(provider) {
    return (req, res, next) => {
      if (req.query.redirect) {
        req.session.oauthRedirect = req.query.redirect;
      }
      
      const options = {
        session: false,
        scope: provider === 'google' ? ['profile', 'email'] : ['user:email']
      };
      
      passport.authenticate(provider, options)(req, res, next);
    };
  }
  
  /**
   * Gère le callback OAuth
   */
  static async handleCallback(req, res) {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'OAuth authentication failed'
        });
      }
      
      // Déterminer le provider
      const provider = req.originalUrl.includes('google') ? 'google' : 'github';
      
      console.log(`✅ OAuth ${provider} success for ${user.email}`);
      
      // Générer les tokens
      const tokens = await TokenService.generateTokens(user);
      
      // Sauvegarder le refresh token
      await TokenService.saveRefreshToken(user.id, tokens.refreshToken, {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      });
      
      // Log dans l'historique
      try {
        await prisma.loginHistory.create({
          data: {
            userId: user.id,
            loginMethod: `oauth_${provider}`,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            success: true
          }
        });
      } catch (historyError) {
        console.log('Note: LoginHistory might not exist yet');
      }
      
      // Gérer la redirection
      const redirectUrl = req.session.oauthRedirect || process.env.FRONTEND_URL;
      
      if (redirectUrl && req.session.oauthRedirect) {
        const redirectWithTokens = `${redirectUrl}?access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`;
        return res.redirect(redirectWithTokens);
      }
      
      // Réponse JSON
      return res.json({
        success: true,
        message: `Authenticated with ${provider} successfully`,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            emailVerified: !!user.emailVerifiedAt,
            provider: user.provider
          }
        }
      });
      
    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error during OAuth authentication'
      });
    }
  }
  
  /**
   * Liste les providers disponibles
   */
  static listProviders(req, res) {
    const providers = [];
    
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      providers.push({
        name: 'google',
        displayName: 'Google',
        url: '/api/auth/oauth/google',
        icon: 'https://img.icons8.com/color/48/000000/google-logo.png'
      });
    }
    
    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
      providers.push({
        name: 'github',
        displayName: 'GitHub',
        url: '/api/auth/oauth/github',
        icon: 'https://img.icons8.com/ios-filled/50/000000/github.png'
      });
    }
    
    return res.json({
      success: true,
      data: {
        providers,
        message: providers.length > 0 
          ? `${providers.length} OAuth provider(s) available`
          : 'No OAuth providers configured'
      }
    });
  }
  
  /**
   * Route d'erreur
   */
  static oauthError(req, res) {
    return res.status(401).json({
      success: false,
      error: 'OAuth authentication failed',
      details: req.query.error || 'Unknown error occurred'
    });
  }
}

export default OAuthController;