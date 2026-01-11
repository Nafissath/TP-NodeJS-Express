import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "#lib/prisma";
import { config } from "#config/env";

passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        // Création sans password pour OAuth (Règle Prof)
        user = await prisma.user.create({
          data: { email, emailVerifiedAt: new Date(), password: null }
        });
      }

      await prisma.oAuthAccount.upsert({
        where: { provider_providerId: { provider: 'google', providerId: profile.id } },
        update: {},
        create: { provider: 'google', providerId: profile.id, userId: user.id }
      });

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));