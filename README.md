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
- **Notifications** : Alertes email automatiques via Nodemailer (Nouvelle connexion, changement de MDP)

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
   Créez un fichier `.env` à la racine :
   ```env
   PORT=3000
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="votre_secret_super_secure"
   
   # Optionnel : Email (Nodemailer)
   SMTP_HOST=smtp.ethereal.email
   SMTP_PORT=587
   SMTP_USER=votre_utilisateur
   SMTP_PASS=votre_mot_de passe
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
| GET | `/api/users/login-history` | Liste l'historique des connexions |

## Tests
Une collection Postman est disponible dans le dossier `/docs` (ou via le fichier JSON à la racine).
