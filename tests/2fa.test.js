console.log("--- 🧪 TEST DE SÉCURITÉ : FLUX 2FA & RATE LIMIT ---");

// Simulation de l'état utilisateur
let user = {
    email: "test@example.com",
    twoFactorEnabled: true,
    failedAttempts: 0
};

const MAX_ATTEMPTS = 5;

const loginAttempt = (email, password, code = null) => {
    // 1. Simulation Rate Limit
    if (user.failedAttempts >= MAX_ATTEMPTS) {
        console.log("❌ RATE LIMIT : Trop de tentatives. Compte bloqué temporairement.");
        return { status: 429 };
    }

    console.log(`\nTentative de connexion pour ${email}...`);

    // 2. Étape 1 : Mot de passe
    if (password !== "password123") {
        user.failedAttempts++;
        console.log(`❌ MDP incorrect (${user.failedAttempts}/${MAX_ATTEMPTS})`);
        return { status: 401 };
    }

    // 3. Étape 2 : Vérification 2FA
    if (user.twoFactorEnabled) {
        if (!code) {
            console.log("🟠 MFA_REQUIRED : Mot de passe OK, en attente du code TOTP.");
            return { status: 200, mfaRequired: true, mfaToken: "TEMP_TOKEN_XYZ" };
        }

        if (code !== "123456") {
            user.failedAttempts++;
            console.log(`❌ Code 2FA incorrect (${user.failedAttempts}/${MAX_ATTEMPTS})`);
            return { status: 401 };
        }
    }

    user.failedAttempts = 0; // Reset on success
    console.log("✅ SUCCÈS : Authentification complète. Bienvenue !");
    return { status: 200, accessToken: "JWT_FINAL_123" };
};

// --- SCÉNARIO ---

console.log("\n1️⃣ LOGIN ÉTAPE 1");
const step1 = loginAttempt("test@example.com", "password123");

console.log("\n2️⃣ MAUVAIS CODE 2FA");
loginAttempt("test@example.com", "password123", "000000");

console.log("\n3️⃣ TENTATIVES RÉPÉTÉES (PROVOQUER RATE LIMIT)");
loginAttempt("test@example.com", "password123", "111111");
loginAttempt("test@example.com", "password123", "222222");
loginAttempt("test@example.com", "password123", "333333");
loginAttempt("test@example.com", "password123", "444444"); // 5ème erreur total (car le step 2 comptait déjà pour 1)

console.log("\n4️⃣ TEST DU BLOCAGE");
const blocked = loginAttempt("test@example.com", "password123", "123456");

if (blocked.status === 429) {
    console.log("\n🏆 TEST RÉUSSI : Le Rate Limiting et le 2FA sont cohérents.");
}
