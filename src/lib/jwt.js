// import { SignJWT, jwtVerify } from "jose";

// const secret = new TextEncoder().encode(process.env.JWT_SECRET);
// const alg = "HS256";

// // Access Token (Court terme : 15 min)
// export async function signAccessToken(payload, expiresIn = "15m") {
//   return new SignJWT(payload)
//     .setProtectedHeader({ alg })
//     .setIssuedAt()
//     .setExpirationTime(expiresIn)
//     .sign(secret);
// }

// // Refresh Token (Long terme : 7 jours)
// export async function signRefreshToken(payload, expiresIn = "7d") {
//   return new SignJWT(payload)
//     .setProtectedHeader({ alg })
//     .setIssuedAt()
//     .setExpirationTime(expiresIn)
//     .sign(secret);
// }

// export  async function verifyToken(token) {
//   try {
//   const { payload } = await jwtVerify(token, secret);
//   return payload;
//   } catch (error) {
//     return null;
//   }
// }



import { SignJWT, jwtVerify } from "jose";

// Règle Prof : Utiliser des secrets différents
const accessSecret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET);
const refreshSecret = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET);

const alg = "HS256";

// Fonction pour ajouter du "poids" au token (Règle : 1024 octets)
const getPadding = () => "x".repeat(950);

// Access Token
export async function signAccessToken(payload, expiresIn = "15m") {
  return new SignJWT({ ...payload, _padding: getPadding() }) // On "gonfle" le token
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(accessSecret);
}

// Refresh Token
export async function signRefreshToken(payload, expiresIn = "7d") {
  return new SignJWT(payload) // Le refresh n'a pas besoin d'être aussi lourd, mais tu peux ajouter le padding si tu veux
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(refreshSecret);
}


// Vérification (spécifie quel secret utiliser)
export async function verifyAccessToken(token) {
  try {
    const { payload } = await jwtVerify(token, accessSecret);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function verifyRefreshToken(token) {
  try {
    const { payload } = await jwtVerify(token, refreshSecret);
    return payload;
  } catch (error) {
    return null;
  }
}