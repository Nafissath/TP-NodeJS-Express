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
| POST | `/api/users/change-password` | Change le mot de passe (oldPassword + newPassword) |
| GET | `/api/users/login-history` | Liste l'historique des connexions (succès/échecs) |
| GET | `/api/users/sessions` | Liste les sessions actives (appareils connectés) |
| DELETE | `/api/users/sessions/:id` | Révoque une session spécifique |
| DELETE | `/api/users/sessions` | Révoque toutes les autres sessions |

## Tests
Une collection Postman est disponible dans le dossier `/docs` (ou via le fichier JSON à la racine).

# 🔐 Personne 3 : OAuth & Sessions

## 📋 Responsabilités
- ✅ **OAuth Authentication** (Google & GitHub)
- ✅ **Refresh Token System** avec rotation
- ✅ **Session Management**
- ✅ **Tokens de 1024+ octets** (Exigence critique)

## 🚀 Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 3. Initialiser la base de données
npx prisma db push
npx prisma generate

# 4. Démarrer le serveur
npm run dev