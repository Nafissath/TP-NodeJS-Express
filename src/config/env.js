import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  EMAIL_TOKEN_SECRET: process.env.EMAIL_TOKEN_SECRET,

  // Configuration Email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
  APP_NAME: process.env.APP_NAME || 'TP NodeJS',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Configuration 2FA (Personne 4)
  TWO_FACTOR_APP_NAME: process.env.TWO_FACTOR_APP_NAME || 'TP-NodeJS-Express',
  TWO_FACTOR_ISSUER: process.env.TWO_FACTOR_ISSUER || 'TP-NodeJS-Express',
};
