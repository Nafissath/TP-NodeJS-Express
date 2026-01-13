# 📔 Rapport Technique de Soutenance - API d'Authentification

Ce document explique en détail le **"Comment"** et le **"Pourquoi"** du développement, le rôle de chaque membre, les outils utilisés et la configuration système complète.

---

## 🏗️ 1. Architecture Globale
Le projet suit une **Clean Architecture** pour séparer les responsabilités :
*   **Infrastructure (`src/lib/`)** : Outils de bas niveau (Prisma pour la DB, JWT pour les jetons, Argon2 pour le hashage).
*   **Domaine (`src/services/`)** : C'est ici que l'intelligence métier réside (calcul du 2FA, vérification des règles de session).
*   **Application (`src/controllers/`)** : Gère l'entrée (req) et la sortie (res) HTTP.
*   **Sécurité (`src/middlewares/`)** : Des gardiens qui interceptent les requêtes (ex: vérifier si vous êtes banni par le Rate Limit avant d'accéder au login).

---

## 🔐 2. Analyse Approfondie des Fonctionnalités

### A. Le flux de Connexion et 2FA (Personne 4)
*   **Le concept** : On ne donne pas l'accès final tant que la deuxième preuve n'est pas fournie.
*   **Le "Comment"** : Dans `user.controller.js`, si le 2FA est actif, on renvoie une erreur spécifique avec un `mfaToken`. L'utilisateur doit ensuite appeler `/login/2fa` avec le code de son téléphone.
*   **Protection Brute-Force** : Utilise l'algorithme de limitation de débit. Si quelqu'un bombarde l'API, son IP est temporairement mise en quarantaine au niveau du réseau.

### B. Gestion des Sessions par Whitelist (Personne 3 & 5)
*   **Le concept** : Une session est valide seulement si elle est présente en base de données.
*   **Rotation** : À chaque renouvellement, l'ancien Refresh Token est détruit et un nouveau est créé. Si un pirate vole un vieux token, il sera rejeté car il ne figure plus dans la **Whitelist**.
*   **Révocation** : On peut révoquer ("killer") une session à distance simplement en mettant à jour le champ `revokedAt` dans la table `RefreshToken`.

### C. Contrainte de Taille des Tokens JWT (Personne 3)
*   **La solution** : Le JWT contient un champ `_padding` rempli de caractères inutiles (950 octets) pour forcer la taille du token à dépasser les 1024 octets demandés par le professeur.

---

## 🛠️ 3. Répartition Technique par Personne

*   **PERSONNE 1** : Structure de base, validation des données (Zod), DTO (Data Transfer Object) pour masquer les données sensibles, et Hashage Argon2.
*   **PERSONNE 2** : Flux Email (Nodemailer), Reset Password, et service de nettoyage des tokens périmés (Cleanup).
*   **PERSONNE 3** : Google OAuth (Passport.js), Algorithme de Padding JWT, et logique de Rotation des sessions.
*   **PERSONNE 4 (Vous)** : Sécurité périmétrique (Rate Limit), Algorithme TOTP (Speakeasy), et modification du login pour l'interception 2FA.
*   **PERSONNE 5** : Dashboard des sessions (IP, Device), Révocation à distance, et Middleware d'authentification central (`auth.js`).

---

## ✅ 4. Validation par les Tests

Pour prouver que tout fonctionne, lancez ces commandes directement dans `tests/` :
1.  **Taille des tokens** : `node tests/token.test.js`
2.  **Rotation des sessions** : `node tests/oauth.test.js`
3.  **Révocation distante** : `node tests/sessions.test.js`
4.  **Sécurité 2FA & Rate Limit** : `node tests/2fa.test.js`
5.  **Flux Email & Reset** : `node tests/email.test.js`

---

## 📦 5. Les Dépendances (Pourquoi ces outils ?)

| Dépendance | Utilité | Pourquoi ce choix ? |
| :--- | :--- | :--- |
| **express** | Framework Backend | Permet de structurer l'API et de gérer les routes et les middlewares de manière fluide. |
| **@prisma/client** | ORM (Base de données) | Sécurise les accès à la base de données SQLite en évitant les injections SQL et en simplifiant les relations. |
| **argon2** | Hashage de mot de passe | Recommandé par l'OWASP, il résiste mieux aux attaques par GPU que bcrypt ou sha256. |
| **jsonwebtoken** | Gestion des JWT | Standard industriel pour transporter des informations d'identité de manière infalsifiable. |
| **jose** | JWT de bas niveau | Utilisé ici pour des options de signature et de manipulation fine du payload (Padding). |
| **speakeasy** | Authentification 2FA | Gère la génération de secrets et la vérification des codes TOTP synchronisés sur le temps. |
| **express-rate-limit**| Protection Anti-BruteForce | Middleware qui compte les requêtes par IP pour bloquer les tentatives de craquage de mot de passe. |
| **nodemailer** | Moteur d'envoi d'email | Permet d'envoyer des emails de confirmation et de reset via des serveurs SMTP sécurisés. |
| **passport** | Middleware OAuth | Gère les stratégies d'authentification tierces (Google) de manière modulaire et sécurisée. |
| **zod** | Validation de Schéma | Garantit que les données entrantes (JSON) sont conformes au type attendu avant traitement. |

---

## 🌍 6. Les Variables d'Environnement (`.env`)

### Configuration Système
*   **`PORT`** : Port de communication du serveur Express.
*   **`DATABASE_URL`** : Chemin vers la base de données SQLite.

### Sécurité & Secrets
*   **`ACCESS_TOKEN_SECRET`** / **`REFRESH_TOKEN_SECRET`** : Clés pour signer les jetons.
*   **`EMAIL_TOKEN_SECRET`** : Clé spécifique pour les liens d'email (sécurité isolée).

### Configuration Email
*   **`SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS`** : Paramètres du serveur mail.
*   **`FRONTEND_URL`** : Utilisé pour construire les liens cliquables envoyés à l'utilisateur.
