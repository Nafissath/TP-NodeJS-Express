# Personne 2: Vérification Email & Tokens Temporaires

Cette documentation décrit l'implémentation de la vérification email et de la gestion des tokens temporaires.

## 📧 Fonctionnalités implémentées

### 1. Service d'Emails
- **Configuration Nodemailer** avec support SMTP
- **Templates HTML** pour les emails de vérification et réinitialisation
- **Mode développement** avec mock si pas de configuration SMTP

### 2. Gestion des Tokens
- **Tokens de vérification email** (24h validité)
- **Tokens de réinitialisation mot de passe** (1h validité)
- **Nettoyage automatique** des tokens expirés

### 3. Endpoints API

#### Vérification Email
```http
POST /api/auth/verify-email/:token
```
- Vérifie un token de validation email
- Marque l'email comme vérifié dans la base de données
- Consomme le token après utilisation

```http
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```
- Renvoie un email de vérification
- Génère un nouveau token
- Vérifie que l'email n'est pas déjà vérifié

#### Mot de Passe Oublié
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```
- Génère un token de réinitialisation
- Envoie un email avec le lien de réinitialisation
- Protection contre l'énumération d'emails (toujours retourne succès)

```http
POST /api/auth/reset-password/:token
Content-Type: application/json

{
  "password": "nouveau-mot-de-passe"
}
```
- Vérifie le token de réinitialisation
- Met à jour le mot de passe
- Envoie une notification de sécurité
- Consomme le token

#### Nettoyage Tokens
```http
POST /api/auth/cleanup-tokens
```
- Supprime tous les tokens expirés
- Peut être appelé par un cron job
- Retourne le nombre de tokens supprimés

## 🔧 Configuration

### Variables d'environnement requises:
```bash
# Configuration Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app
SMTP_FROM=votre-email@gmail.com

# Application
APP_NAME=TP NodeJS Express
FRONTEND_URL=http://localhost:3000
```

### Configuration Gmail:
1. Activer l'authentification à deux facteurs
2. Générer un **mot de passe d'application**
3. Utiliser ce mot de passe dans `SMTP_PASS`

## 📋 Flux de travail

### Inscription avec vérification email:
1. `POST /api/auth/register` → Crée utilisateur non vérifié
2. Envoi automatique email de vérification
3. `POST /api/auth/verify-email/:token` → Vérifie l'email
4. L'utilisateur peut maintenant se connecter

### Réinitialisation mot de passe:
1. `POST /api/auth/forgot-password` → Envoie email
2. `POST /api/auth/reset-password/:token` → Réinitialise
3. Envoi notification de sécurité

## 🛡️ Sécurité

- **Tokens uniques** et cryptographiquement sécurisés
- **Expiration** des tokens (24h pour email, 1h pour mot de passe)
- **Rate limiting** sur tous les endpoints
- **Protection contre énumération** d'emails
- **Nettoyage automatique** des tokens expirés

## 🧪 Tests

### Exemples de requêtes:

```bash
# Renvoyer email de vérification
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Demander réinitialisation mot de passe
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Nettoyer tokens expirés
curl -X POST http://localhost:3000/api/auth/cleanup-tokens
```

## 🔄 Intégration avec autres personnes

### Dépendances:
- **Personne 1**: Modèle User, système d'authentification
- **Personne 5**: Notifications de sécurité intégrées

### Utilisation par d'autres:
- Le service email peut être réutilisé pour les notifications
- Les tokens sont nettoyés automatiquement
- Les templates sont extensibles
