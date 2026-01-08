# Guide de Test Yaak - Personne 2

## 🚀 Démarrage

Le serveur est démarré sur `http://localhost:3000`

## 📥 Importer la Collection

1. Ouvrez Yaak
2. Importez le fichier `yaak-personne2-collection.json`
3. Sélectionnez l'environnement "Développement"

## 🧪 Scénarios de Test

### 1. Test d'envoi d'email de vérification

**Requête:** `Renvoyer Email de Vérification`
- **Méthode:** POST
- **URL:** `http://localhost:3000/api/auth/resend-verification`
- **Body:**
```json
{
  "email": "test@example.com"
}
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Email de vérification envoyé"
}
```

### 2. Test de demande de réinitialisation de mot de passe

**Requête:** `Demander Réinitialisation Mot de Passe`
- **Méthode:** POST
- **URL:** `http://localhost:3000/api/auth/forgot-password`
- **Body:**
```json
{
  "email": "test@example.com"
}
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Si un compte existe avec cette adresse email, vous recevrez un email de réinitialisation"
}
```

### 3. Vérification des emails dans Mailtrap

1. Connectez-vous à [Mailtrap](https://mailtrap.io)
2. Vérifiez les emails reçus dans votre sandbox
3. Les tokens seront visibles dans les URLs des emails

### 4. Test de vérification d'email

**Requête:** `Vérifier Email`
- **Méthode:** POST
- **URL:** `http://localhost:3000/api/auth/verify-email/{TOKEN}`
- Remplacez `{TOKEN}` par le token reçu dans l'email

### 5. Test de réinitialisation de mot de passe

**Requête:** `Réinitialiser Mot de Passe`
- **Méthode:** POST
- **URL:** `http://localhost:3000/api/auth/reset-password/{TOKEN}`
- **Body:**
```json
{
  "password": "NouveauMotDePasse123!"
}
```

### 6. Nettoyage des tokens expirés

**Requête:** `Nettoyer Tokens Expirés`
- **Méthode:** POST
- **URL:** `http://localhost:3000/api/auth/cleanup-tokens`

## 🔍 Tests d'erreur

### Email non trouvé
```json
{
  "email": "inexistant@example.com"
}
```
Devrait retourner un message d'erreur approprié.

### Token invalide
Utilisez un token faux comme `abc123` dans les endpoints de vérification.

### Token expiré
Attendez 24h pour le token de vérification ou 1h pour le token de réinitialisation.

## 📊 Logs du serveur

Le serveur affiche les logs dans le terminal. Vous devriez voir:
- `[EMAIL MOCK]` si pas de configuration SMTP
- Logs de création/suppression de tokens
- Logs d'envoi d'emails

## 🛠️ Configuration Mailtrap

Les identifiants sont déjà configurés:
- **Host:** sandbox.smtp.mailtrap.io
- **Port:** 587
- **Username:** 7037a821a46c23
- **Password:** 2f24a95f32dfd4

## ✅ Checklist de Test

- [ ] Envoi email de vérification
- [ ] Envoi email de réinitialisation
- [ ] Vérification email avec token valide
- [ ] Réinitialisation mot de passe avec token valide
- [ ] Gestion des erreurs (email non trouvé, token invalide)
- [ ] Nettoyage tokens expirés
- [ ] Vérification emails dans Mailtrap

## 🐛 Dépannage

### Le serveur ne démarre pas
- Vérifiez que le port 3000 est libre
- Vérifiez que `.env` est configuré

### Emails non reçus
- Vérifiez la configuration SMTP dans `.env`
- Consultez les logs du serveur

### Tokens non valides
- Les tokens sont sensibles à la casse
- Vérifiez qu'il n'y a pas d'espaces supplémentaires
- Assurez-vous que le token n'a pas expiré
