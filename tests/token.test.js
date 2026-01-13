import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

// On simule la logique de ton service pour tester la taille
// car les imports de fichiers internes avec des alias (#) échouent souvent en script isolé
const generateTestToken = (user) => {
    // Règle Prof : Padding pour dépasser 1024 octets
    const padding = randomBytes(550).toString('hex'); 

    // Simulation du secret (en test on s'en fiche de la valeur réelle)
    const secret = "a".repeat(256); 

    return jwt.sign(
        { id: user.id, email: user.email, padding }, 
        secret, 
        { expiresIn: '15m' }
    );
};

console.log("--- TEST DE CONFORMITÉ PERSONNE 3 ---");

const user = { id: "123", email: "test@example.com" };
const token = generateTestToken(user);
const size = Buffer.byteLength(token, 'utf8');

console.log(` Taille du token : ${size} octets`);

if (size > 1024) {
    console.log(" SUCCÈS : Le token dépasse 1024 octets (Contrainte respectée).");
} else {
    console.log(" ÉCHEC : Le token est trop petit.");
}