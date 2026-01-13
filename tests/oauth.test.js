console.log("--- TEST DE SÉCURITÉ : ROTATION DES TOKENS ---");

// Simulation de la base de données
let database = {
    refreshTokens: [
        { id: 1, token: "REFRESH_TOKEN_1", revokedAt: null }
    ]
};

const refreshAction = (tokenUsed) => {
    console.log(`Tentative d'utilisation du token : ${tokenUsed}`);
    
    const storedToken = database.refreshTokens.find(t => t.token === tokenUsed);

    if (!storedToken || storedToken.revokedAt !== null) {
        console.log(" RÉSULTAT : Accès refusé ! Le token est déjà révoqué ou invalide.");
        return null;
    }

    storedToken.revokedAt = new Date(); // On brûle l'ancien
    const newToken = "REFRESH_TOKEN_NEW_" + Math.random();
    database.refreshTokens.push({ id: 2, token: newToken, revokedAt: null });
    
    console.log(" SUCCÈS : Nouveau token généré. L'ancien est maintenant révoqué.");
    return newToken;
};


console.log("\n1. Première tentative avec REFRESH_TOKEN_1 :");
const step1 = refreshAction("REFRESH_TOKEN_1");

console.log("\n2. Deuxième tentative avec le MÊME REFRESH_TOKEN_1 (Simulation de vol) :");
const step2 = refreshAction("REFRESH_TOKEN_1");

if (!step2) {
    console.log("\n TEST RÉUSSI : La sécurité par rotation fonctionne.");
}