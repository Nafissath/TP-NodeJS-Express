# 🔐 Partie Personne 4 : 2FA & Sécurité

## 📋 Ce que j'ai fait

J'ai implémenté l'**Authentification à Deux Facteurs (2FA)** et la **protection contre le brute-force**, comme demandé dans le sujet.

---

## ✅ Fonctionnalités

### 1. Authentification à Deux Facteurs (2FA)
J'ai créé un système simple pour sécuriser les comptes :

*   **Activation** : L'utilisateur reçoit un "secret" (code texte) qu'il doit entrer dans son application (Google Authenticator).
*   **Vérification** : Pour se connecter ou activer l'option, il doit fournir le code à 6 chiffres donné par l'appli.
*   **Désactivation** : Il peut retirer le 2FA s'il le souhaite.

> **Note** : J'ai utilisé la librairie `speakeasy` pour gérer les codes TOTP (Time-based One-Time Password). Je n'ai pas mis de QR code pour rester simple, l'utilisateur copie juste le secret.

### 2. Rate Limiting (Sécurité)
J'ai protégé l'API contre les attaques de force brute avec `express-rate-limit` :

*   **Protection Globale** : Limite le nombre de requêtes par IP pour éviter la surcharge.
*   **Protection Login** : Limite les essais de mots de passe (5 essais max).
*   **Protection 2FA** : Limite les essais de codes 2FA.

---

## 🚀 Mes Routes (API)

| Méthode | URL | Description |
| :--- | :--- | :--- |
| `POST` | `/api/2fa/setup` | Génère le secret à copier dans l'appli |
| `POST` | `/api/2fa/enable` | Active le 2FA (nécessite un code valide) |
| `POST` | `/api/2fa/verify` | Vérifie un code (pour le login) |
| `POST` | `/api/2fa/disable` | Désactive le 2FA |
| `GET` | `/api/2fa/status` | Dit si le 2FA est activé ou non |

---

## 📂 Mes Fichiers

*   `src/services/twoFactor.service.js` : La logique (génération secret, vérification).
*   `src/controllers/twoFactor.controller.js` : Gestion des requêtes.
*   `src/routes/twoFactor.routes.js` : Définition des URLs.
*   `src/middlewares/rate-limit.js` : Configuration de la sécurité.

---

## 🛠️ Installation

```bash
npm install
npm run dev
```
