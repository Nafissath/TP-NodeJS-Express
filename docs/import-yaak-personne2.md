# Importer les requêtes Personne 2 dans Yaak

## 📥 Méthode 1: Importer le fichier JSON

1. **Ouvrez Yaak**
2. **Allez dans File > Import** ou utilisez le raccourci `Ctrl+I`
3. **Sélectionnez le fichier** `yaak-personne2-requests.json`
4. **Confirmez l'importation**

## 📂 Ce qui sera ajouté

### 📧 Nouveau dossier: "Personne 2 - Email Verification"
Ce dossier sera ajouté dans votre dossier "express-tp" existant et contiendra:

1. **Renvoyer Email Vérification**
   - URL: `POST {{BASE_URL}}/api/auth/resend-verification`
   - Utilise la variable `{{TEST_EMAIL}}`

2. **Vérifier Email**
   - URL: `POST {{BASE_URL}}/api/auth/verify-email/{{VERIFICATION_TOKEN}}`
   - Vous devrez remplacer `{{VERIFICATION_TOKEN}}` par le token reçu

3. **Demander Réinitialisation MDP**
   - URL: `POST {{BASE_URL}}/api/auth/forgot-password`
   - Utilise la variable `{{TEST_EMAIL}}`

4. **Réinitialiser Mot de Passe**
   - URL: `POST {{BASE_URL}}/api/auth/reset-password/{{RESET_TOKEN}}`
   - Vous devrez remplacer `{{RESET_TOKEN}}` par le token reçu

5. **Nettoyer Tokens Expirés**
   - URL: `POST {{BASE_URL}}/api/auth/cleanup-tokens`
   - Pour la maintenance

### 🔧 Nouvel environnement: "Personne 2 - Email Verification"

Variables disponibles:
- `BASE_URL`: `http://localhost:3000`
- `TEST_EMAIL`: `test@example.com` (modifiable)
- `VERIFICATION_TOKEN`: À remplir avec le token reçu
- `RESET_TOKEN`: À remplir avec le token reçu

## 🧪 Scénario de Test Complet

### 1. Créer un utilisateur (votre requête existante)
```json
POST {{BASE_URL}}/register
{
  "email": "test@example.com",
  "password": "Password123!",
  "firstName": "Jean",
  "lastName": "Dupont"
}
```

### 2. Renvoyer email de vérification
Utilisez la requête **Renvoyer Email Vérification**
- Vérifiez les logs du serveur pour voir l'email envoyé
- Si configuré avec Mailtrap, vérifiez votre inbox

### 3. Extraire le token
Dans l'email reçu, vous trouverez un lien comme:
`http://localhost:3000/verify-email/a1b2c3d4e5f6...`

Copiez uniquement la partie `a1b2c3d4e5f6...`

### 4. Mettre à jour l'environnement
1. Allez dans l'environnement "Personne 2 - Email Verification"
2. Remplacez `{{VERIFICATION_TOKEN}}` par le token copié

### 5. Vérifier l'email
Utilisez la requête **Vérifier Email**

### 6. Tester la réinitialisation de mot de passe
1. Utilisez **Demander Réinitialisation MDP**
2. Copiez le token de l'email reçu
3. Mettez à jour `{{RESET_TOKEN}}` dans l'environnement
4. Utilisez **Réinitialiser Mot de Passe**

## 🔍 Vérification

Après avoir importé, vous devriez voir:
- ✅ Nouveau dossier "Personne 2 - Email Verification"
- ✅ 5 nouvelles requêtes 
- ✅ Nouvel environnement avec variables pré-configurées

## 🐛 Dépannage

### L'importation échoue
- Vérifiez que Yaak est bien fermé pendant l'importation
- Essayez de redémarrer Yaak

### Variables non reconnues
- Sélectionnez l'environnement "Personne 2 - Email Verification"
- Vérifiez que les variables sont bien activées (toggle vert)

### Requêtes non trouvées
- Les requêtes sont dans le dossier "express-tp" > "Personne 2 - Email Verification"
- Utilisez la barre de recherche pour les retrouver rapidement

## 📝 Notes

- Les requêtes existantes ne sont pas modifiées
- Vous pouvez utiliser plusieurs environnements simultanément
- Les variables sont partagées entre toutes les requêtes du même environnement
