import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import prisma from '../lib/prisma.js';

const initializePassport = () => {
  // Google Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_URL}/api/auth/oauth/google/callback`,
      scope: ['profile', 'email'],
      state: true
    }, googleOAuthCallback));
    
    console.log('✅ Google OAuth strategy configured');
  }

  // GitHub Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.API_URL}/api/auth/oauth/github/callback`,
      scope: ['user:email'],
      state: true
    }, githubOAuthCallback));
    
    console.log('✅ GitHub OAuth strategy configured');
  }

  // Serialization
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { 
          id: true, 
          email: true, 
          name: true,
          avatar: true,
          emailVerifiedAt: true
        }
      });
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};

// Callbacks
async function googleOAuthCallback(accessToken, refreshToken, profile, done) {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('No email provided by Google'));
    }

    return await handleOAuthLogin('google', profile.id, email, {
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value,
      accessToken,
      refreshToken,
      rawProfile: profile._json
    }, done);
  } catch (error) {
    return done(error);
  }
}

async function githubOAuthCallback(accessToken, refreshToken, profile, done) {
  try {
    const primaryEmail = profile.emails?.find(e => e.primary)?.value || 
                        profile.emails?.[0]?.value ||
                        `${profile.username}@users.noreply.github.com`;

    return await handleOAuthLogin('github', profile.id, primaryEmail, {
      name: profile.displayName || profile.username,
      avatar: profile.photos?.[0]?.value,
      accessToken,
      refreshToken,
      rawProfile: profile._json
    }, done);
  } catch (error) {
    return done(error);
  }
}

async function handleOAuthLogin(provider, providerId, email, profileData, done) {
  try {
    // 1. Chercher un compte OAuth existant
    let oauthAccount = await prisma.oAuthAccount.findUnique({
      where: { 
        provider_providerId: { 
          provider, 
          providerId 
        }
      },
      include: { user: true }
    });

    // 2. Si trouvé, mettre à jour
    if (oauthAccount) {
      await prisma.oAuthAccount.update({
        where: { id: oauthAccount.id },
        data: {
          accessToken: profileData.accessToken,
          refreshToken: profileData.refreshToken,
          profile: profileData.rawProfile,
          updatedAt: new Date()
        }
      });
      
      return done(null, oauthAccount.user);
    }

    // 3. Chercher utilisateur par email
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // 4. Créer utilisateur si nécessaire
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: profileData.name,
          avatar: profileData.avatar,
          emailVerifiedAt: new Date(), // OAuth emails sont vérifiés
          provider: provider
        }
      });
    }

    // 5. Créer le lien OAuth
    await prisma.oAuthAccount.create({
      data: {
        provider,
        providerId,
        email: user.email,
        accessToken: profileData.accessToken,
        refreshToken: profileData.refreshToken,
        profile: profileData.rawProfile,
        userId: user.id
      }
    });

    console.log(`✅ OAuth login successful: ${email} via ${provider}`);
    return done(null, user);
    
  } catch (error) {
    console.error(`❌ OAuth login error for ${provider}:`, error);
    return done(error);
  }
}

export { initializePassport };