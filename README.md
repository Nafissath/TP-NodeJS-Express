# TP Node.js Express - Gestion de Profil & Sécurité

Ce projet est une API de gestion d'utilisateurs robuste construite avec Express, Prisma et Zod.

## Fonctionnalités (Personne 5)

### 👤 Gestion du Profil
- **Consultation** : `GET /api/users/me`
- **Modification** : `PATCH /api/users/me` (Nom, Prénom, Email)
- **Suppression** : `DELETE /api/users/me` (Désactivation de compte / Soft Delete)

### 🔒 Sécurité & Authentification
- **Changement de MDP** : `POST /api/users/change-password`
- **Historique** : `GET /api/users/login-history` (Suivi des IP/Appareils)
- **Protection Brute-Force** : Limitation des tentatives via `express-rate-limit`
- **Gestion des Sessions** : Listing et révocation des tokens actifs
- **Notifications** : Alertes email (Mailtrap) pour les actions sensibles (Login, Changement MDP)
- **Conformité Specs** : Soft delete (`disabledAt`), logs d'échecs, vérification Blacklist.

🔐 Sessions & AuthentificationSociale (Personne 3)
- **Maintien de Session** : Système de Refresh Token avec rotation automatique (chaque usage génère un nouveau token et invalide le précédent).

- **Sécurité des Tokens** : Conformité avec l'exigence des tokens > 1024 octets via un padding dynamique.

- **Authentification Sociale** : Connexion via Google OAuth avec création de compte automatique (sans mot de passe).

- **Gestion Multi-Appareils** : Listing des sessions actives avec détection de l'IP et du User-Agent.

### 📧 Intégration Équipe (Personne 2)
- **Vérification Email** : Intégration du flux de validation par token.
- **Service Email Unifié** : Utilisation d'un `EmailService` commun configuré pour Mailtrap.



## Installation

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
   Créez un fichier `.env` à partir de l'exemple :
   ```env
   PORT=3000
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="votre_secret_super_secure"
   NODE_ENV=development

   # Mailtrap / SMTP (Indispensable pour tests)
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=587
   SMTP_USER=votre_user
   SMTP_PASS=votre_pass
   SMTP_FROM=no-reply@votre-app.com
   APP_NAME="TP NodeJS Express"
   ```
 #Secrets Personne 1 & 3 (Doivent faire 256 caractères pour la conformité)
ACCESS_TOKEN_SECRET="une_chaine_tres_longue_de_256_caracteres..."
REFRESH_TOKEN_SECRET="une_autre_chaine_tres_longue_de_256_caracteres..."

#Google OAuth (Personne 3)
GOOGLE_CLIENT_ID="votre_client_id_google"
GOOGLE_CLIENT_SECRET="votre_client_secret_google"

4. **Base de données**
   ```bash
   npm run db:push
   npm run db:generate
   ```

5. **Lancer le serveur**
   ```bash
   npm run dev
   ```

## Documentation API

### Authentification requise (Bearer Token)
Tous ces endpoints nécessitent un header `Authorization: Bearer <token>`.

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/users/me` | Récupère le profil de l'utilisateur actuel |
| PATCH | `/api/users/me` | Met à jour le profil (firstName, lastName, email) |
| DELETE | `/api/users/me` | Désactive le compte (Soft Delete) |
| POST | `/api/users/change-password/auth/refresh` | Change le mot de passe (oldPassword + newPassword), Renouvelle l'Access Token via un Refresh Token (Rotation incluse) |
| GET | `/api/users/login-history/auth/google` | Liste l'historique des connexions (succès/échecs), Initie l'authentification via Google |
| GET | `/api/users/sessions` | Liste les sessions actives (appareils connectés), Liste les sessions actives (IP, Appareil, Date) |
| DELETE | `/api/users/sessions/:id` | Révoque une session spécifique |
| DELETE | `/api/users/sessions/revoke-others` | Révoque toutes les autres sessions, Déconnecte tous les autres appareils connectés |


## Tests
Une collection Postman est disponible dans le dossier `/docs` (ou via le fichier JSON à la racine).
