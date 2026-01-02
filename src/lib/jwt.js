import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const alg = "HS256";

// Access Token (Court terme : 15 min)
export async function signAccessToken(payload, expiresIn = "15m") {
  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

// Refresh Token (Long terme : 7 jours)
export async function signRefreshToken(payload, expiresIn = "7d") {
  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export  async function verifyToken(token) {
  try {
  const { payload } = await jwtVerify(token, secret);
  return payload;
  } catch (error) {
    return null;
  }
}