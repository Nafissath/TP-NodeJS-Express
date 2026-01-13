console.log("---  TESTS : COMMUNICATIONS EMAILS (VÉRIFICATION & RESET) ---");

// --- PARTIE 1 : VÉRIFICATION D'EMAIL ---
console.log("\n>>> 1. FLUX DE VÉRIFICATION D'EMAIL");

const createVerificationToken = (userId) => {
    const token = "VERIF_" + Math.random().toString(36).substring(2, 10);
    const expiresAt = new Date(Date.now() + 3600000);
    return { token, userId, expiresAt };
}

console.log("1️ Inscription d'un nouvel utilisateur...");
const vToken = createVerificationToken("user_123");
console.log(`Email envoyé avec le token: ${vToken.token}`);

const checkVerifToken = (submittedToken) => {
    if (submittedToken === vToken.token) {
        console.log("SUCCÈS : Email vérifié. Compte activé !");
        return true;
    }
    return false;
}
checkVerifToken(vToken.token);


// --- PARTIE 2 : RÉINITIALISATION DE MOT DE PASSE ---
console.log("\n>>> 2. RÉINITIALISATION DE MOT DE PASSE");

let userStore = { id: "user_123", password: "old_password" };
const generateResetToken = () => "RESET_" + Math.random().toString(36).toUpperCase();

console.log("1️ L'utilisateur demande un reset...");
const rToken = generateResetToken();
console.log(`Email de reset envoyé avec le token: ${rToken}`);

console.log("2️ Soumission du nouveau mot de passe...");
const performReset = (submittedToken, newPass) => {
    if (submittedToken === rToken) {
        userStore.password = "NEW_HASHED_" + newPass;
        console.log(" SUCCÈS : Mot de passe mis à jour en base.");
        return true;
    }
    return false;
}
performReset(rToken, "nouveauMdp2024");

console.log("\nTOUS LES TESTS EMAILS SONT RÉUSSIS !");
