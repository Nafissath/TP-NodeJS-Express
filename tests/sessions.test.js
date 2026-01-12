console.log("--- 🧪 TEST : GESTION DES SESSIONS MULTIPLES ---");

// Simulation de plusieurs appareils connectés pour un même utilisateur
let userSessions = [
    { id: "S1", device: "Chrome / Windows", token: "ABC", revokedAt: null },
    { id: "S2", device: "Safari / iPhone", token: "XYZ", revokedAt: null },
    { id: "S3", device: "Firefox / Linux", token: "123", revokedAt: null }
];

const revokeOthers = (currentSessionId) => {
    console.log(`\nAction : Révocation de toutes les sessions sauf ${currentSessionId}`);
    
    let count = 0;
    userSessions.forEach(session => {
        if (session.id !== currentSessionId && session.revokedAt === null) {
            session.revokedAt = new Date();
            count++;
        }
    });
    
    console.log(`✅ Résultat : ${count} sessions ont été révoquées.`);
};

// --- SCÉNARIO ---
console.log("Sessions actives au départ :", userSessions.filter(s => !s.revokedAt).length);

// On simule que l'utilisateur est sur son PC (S1) et veut déconnecter les autres
revokeOthers("S1");

console.log("\nSessions encore actives :");
userSessions.forEach(s => {
    console.log(`- ${s.device} : ${s.revokedAt ? '🔴 RÉVOQUÉ' : '🟢 ACTIF'}`);
});

if (userSessions.filter(s => !s.revokedAt).length === 1) {
    console.log("\n🏆 TEST RÉUSSI : La révocation sélective fonctionne.");
}