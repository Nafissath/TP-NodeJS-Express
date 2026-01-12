# TP Node.js Express - Gestion de Profil & Sécurité Multi-Collaborateurs

Ce projet est une API de gestion d'utilisateurs robuste et sécurisée, construite avec Express, Prisma (SQLite) et Zod. Elle intègre des fonctionnalités avancées d'authentification, de sécurité et de monitoring développées en équipe.

## 👥 Équipe et Contributions

### 👤 Personne 1 : Authentification de Base
- **Inscription** : `POST /api/auth/register` (Hachage Argon2).
- **Connexion** : `POST /api/auth/login` (Génération de tokens JWT).
- **Déconnexion** : `POST /api/auth/logout`.

### 📧 Personne 2 : Sécurité Email
- **Vérification Email** : Envoi de tokens de validation via Mailtrap.
- **Réinitialisation de mot de passe** : Flux sécurisé `forgot-password` / `reset-password`.
- **Nettoyage automatique** : Script de suppression des tokens expirés.

### 🔐 Personne 3 : Maintien de Session & OAuth
- **Rotation de Refresh Token** : Chaque usage génère un nouveau token et invalide le précédent pour prévenir le vol de session.
- **Sécurité des Tokens** : Padding dynamique pour garantir des tokens > 1024 octets.
- **Authentification Sociale** : Connexion via Google OAuth (Passport.js).
- **Gestion Multi-Appareils** : Détection de l'IP et du User-Agent.

### 🛡️ Personne 4 : Double Authentification (2FA)
- **TOTP (Google Authenticator)** : Configuration et activation du 2FA.
- **Vérification** : Étape supplémentaire obligatoire après le login classique si activé.
- **Endpoints** : Setup, Enable, Disable, Verify, Status.

### 📊 Personne 5 : Profil & Monitoring (Toi !)
- **Gestion du Profil** : Consultation (`GET /me`) et mise à jour (`PATCH /me`) sécurisées.
- **Soft Delete** : Désactivation de compte via `disabledAt` au lieu d'une suppression physique.
- **Historique de Connexion** : Journal des accès (IP, Appareil, Succès/Échec).
- **Nettoyage Prisma** : Utilisation stricte de clauses `select` pour ne jamais exposer le mot de passe.
- **Invalidation Globale** : Révocation de toutes les sessions lors d'un changement de mot de passe.

---

## 🚀 Installation

1. **Cloner le projet**
   ```bash
   git clone <repo-url>
   cd TP-NodeJS-Express
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration (.env)**
   Créez un fichier `.env` indispensable au fonctionnement :
   ```env
   PORT=3000
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="votre_secret_super_secure"
   NODE_ENV=development

   # Mailtrap / SMTP (Configuration de l'équipe Personne 2)
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=587
   SMTP_USER=votre_user
   SMTP_PASS=votre_pass
   SMTP_FROM=no-reply@votre-app.com

   # Google OAuth (Configuration Personne 3)
   GOOGLE_CLIENT_ID="votre_client_id"
   GOOGLE_CLIENT_SECRET="votre_client_secret"

   # Secrets JWT (256 octets recommandés pour la conformité)
   ACCESS_TOKEN_SECRET="chaine_longue"
   REFRESH_TOKEN_SECRET="chaine_longue"
   ```

4. **Base de données**
   ```bash
   npm run db:push
   npm run db:generate
   ```

5. **Lancer le serveur**
   ```bash
   npm run dev
   ```

---

## 📖 Documentation API

### Authentification & Sessions
| Méthode | Endpoint | Description |
|:---|:---|:---|
| POST | `/api/auth/register` | Création de compte |
| POST | `/api/auth/login` | Connexion (retourne Access + Refresh Token) |
| POST | `/api/auth/logout` | Déconnexion et révocation du token |
| POST | `/api/auth/refresh` | Rotation du Refresh Token |
| GET | `/api/auth/google` | Initier la connexion Google OAuth |

### Vérification & Mot de Passe
| Méthode | Endpoint | Description |
|:---|:---|:---|
| POST | `/api/auth/verify-email/:token` | Validation du compte par email |
| POST | `/api/auth/forgot-password` | Demande de réinitialisation |
| POST | `/api/auth/reset-password/:token` | Mise à jour du MDP via token email |
| POST | `/api/users/change-password` | Changer le MDP (authentifié + révocation sessions) |

### Double Authentification (2FA)
| Méthode | Endpoint | Description |
|:---|:---|:---|
| POST | `/api/2fa/setup` | Génère le secret QR Code |
| POST | `/api/2fa/enable` | Active le 2FA définitivement |
| POST | `/api/2fa/verify` | Vérifie le code TOTP (Post-login) |
| POST | `/api/2fa/disable` | Désactive le 2FA |

### Profil & Monitoring
| Méthode | Endpoint | Description |
|:---|:---|:---|
| GET | `/api/users/me` | Profil de l'utilisateur connecté |
| PATCH | `/api/users/me` | Mise à jour (firstName, lastName, email) |
| DELETE | `/api/users/me` | Soft Delete (Désactivation du compte) |
| GET | `/api/users/login-history` | Journal des connexions (Monitoring) |
| GET | `/api/sessions` | Liste des sessions actives |
| DELETE | `/api/sessions/revoke-others` | Déconnexion de tous les autres appareils |

---

## 🛡️ Mesures de Sécurité Implémentées
- **Rate Limiting** : Protection contre le brute-force sur toutes les routes sensibles.
- **Helmet & CORS** : Protection des headers et gestion des origines.
- **Soft Delete** : Conservation des données pour conformité, mais accès bloqué.
- **JWT Blacklisting** : Les tokens révoqués sont invalidés immédiatement.
- **Password Hashing** : Utilisation d'Argon2 pour la résistance aux attaques hardware.
- **Audit Logs** : Suivi des IPs et des User-Agents pour chaque connexion.

## 🧪 Tests
Une collection Postman mise à jour est disponible à la racine du projet sous le nom `TP_Express_All_Features.json`.
