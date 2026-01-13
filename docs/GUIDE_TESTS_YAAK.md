# 🧪 Guide Ultime de Test - Client Yaak

Ce guide contient **toutes les étapes** pour faire une démonstration complète de l'API, du premier clic à la sécurité avancée.

---

## ⚙️ Configuration de Base
1.  **URL de base** : `http://localhost:3000`
2.  **Affichage des Logs** : Gardez votre terminal (celui où tourne `npm run dev`) ouvert à côté de Yaak pour voir les emails s'afficher.

---

## 🏁 Phase 1 : Cycle de vie du Compte (P1 & P2)

### 1. Inscription (`POST /register`)
*   **Body (JSON)** :
    ```json
    {
      "email": "test@exemple.com",
      "password": "password123",
      "firstName": "Jean",
      "lastName": "Dupont"
    }
    ```
*   **Vérification** : La réponse doit dire "Compte créé".

### 2. Vérification Email (`POST /api/auth/verify-email/:token`)
*   **Action** : Copiez le code alphanumérique qui s'est affiché dans votre terminal.
*   **URL** : Remplacez `:token` par ce code dans l'URL.
*   **Vérification** : La réponse doit confirmer que l'email est vérifié.

### 3. Mot de Passe Oublié (`POST /api/auth/forgot-password`)
*   **Body (JSON)** : `{ "email": "test@exemple.com" }`
*   **Action** : Récupérez le nouveau token dans le terminal.
*   **URL suivante** : `POST /api/auth/reset-password/VOTRE_TOKEN`
*   **Body (JSON)** : `{ "newPassword": "nouveauPassword123" }`

---

## 🔐 Phase 2 : Connexion et Sécurité 2FA (P4)

### 4. Connexion Standard (`POST /login`)
*   **Body (JSON)** : `{ "email": "test@exemple.com", "password": "nouveauPassword123" }`
*   **Réponse** : Vous recevez un `accessToken`. Copiez-le.
*   **Yaak Config** : Allez dans l'onglet **Auth** -> **Bearer** -> Collez le token.

### 5. Configuration du 2FA (`POST /api/2fa/setup`)
*   **Action** : Send. Copiez le `secret` reçu (ex: `JBSW...`).
*   **Mobile** : Ajoutez-le dans Google Authenticator.

### 6. Activation du 2FA (`POST /api/2fa/enable`)
*   **Body (JSON)** : `{ "token": "CODE_A_6_CHIFFRES" }`
*   **Vérification** : Le 2FA est maintenant actif.

### 7. Connexion avec Interception 2FA (`POST /login`)
*   **Action** : Reconnectez-vous. 
*   **Réponse spéciale** : Le serveur répond `mfaRequired: true` et donne un `mfaToken`.
*   **Action finale** : `POST /login/2fa` avec le Body :
    ```json
    { "mfaToken": "LE_TOKEN_REÇU", "code": "NOUVEAU_CODE_MOBILE" }
    ```

---

## 🔄 Phase 3 : Maintenance de Session (P3 & P5)

### 8. Silent Refresh (`POST /api/auth/refresh`)
*   **Body (JSON)** : `{ "refreshToken": "VOTRE_REFRESH_TOKEN" }`
*   **Expliquez au prof** : "On renouvelle les clés sans que l'utilisateur ne doive retaper son mot de passe".

### 9. Liste des Sessions (`GET /api/sessions`)
*   **Action** : Affiche tous vos appareils (IP, Device).
*   **Expliquez au prof** : "C'est la Whitelist des sessions".

### 10. Révocation (`DELETE /api/sessions/:id`)
*   **Action** : Supprimez une session spécifique via son ID.

---

## � Phase 4 : Gestion du Profil et Historique (P5)

### 11. Consulter mon profil (`GET /users/me`)
*   **Auth** : Bearer Token requis.
*   **Vérification** : Doit renvoyer vos infos (sans le mot de passe).

### 12. Modifier mon profil (`PATCH /users/me`)
*   **Body (JSON)** : `{ "firstName": "NouveauNom" }`
*   **Vérification** : Le nom doit être mis à jour.

### 13. Historique de connexion (`GET /users/login-history`)
*   **Expliquez au prof** : "On voit ici toutes les tentatives réussies ou ratées avec l'IP et l'appareil".

### 14. Changer de mot de passe (`POST /users/change-password`)
*   **Body (JSON)** :
    ```json
    {
      "oldPassword": "password123",
      "newPassword": "superSecret456"
    }
    ```
*   **Vérification** : Après cela, vos anciens tokens sont révoqués par sécurité.

### 15. Supprimer son compte (`DELETE /users/me`)
*   **Action** : Rend le compte inactif (Soft Delete).

---

## �🛡️ Phase 5 : Démonstration des "Preuves de Sécurité"

### 16. Test du Rate Limit (P4)
*   **Action** : Faites 5 tentatives de `/login` avec un **faux mot de passe** très rapidement.
*   **Résultat attendu** : Une erreur `429 Too Many Requests`.
*   **Argument** : "Le système protège contre le Brute-force".

### 17. Preuve de la Taille du Token (P3)
*   **Action** : Dans la réponse d'un login réussi, montrez la longueur de l' `accessToken`.
*   **Argument** : "Le token est lourd (> 1024 octets) grâce à l'algorithme de Padding que nous avons implémenté".

### 18. Preuve de la Blacklist (P5)
*   **Action** : Connectez-vous, faites un `POST /api/auth/logout`. Essayez de réutiliser le même token pour voir votre profil (`GET /me`).
*   **Résultat attendu** : Erreur `401 Unauthorized`.
*   **Argument** : "Le token est invalidé instantanément par la Blacklist, même s'il n'est pas encore expiré".
