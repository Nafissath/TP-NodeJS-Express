export class UserDto {
  constructor(user) {
    this.id = user.id;
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.emailVerifiedAt = user.emailVerifiedAt;
    this.twoFactorEnabledAt = user.twoFactorEnabledAt;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    // password, twoFactorSecret, disabledAt sont EXCLUS pour la sécurité
  }

  // Cette méthode permet de transformer soit un utilisateur, soit une liste d'utilisateurs
  static transform(data) {
    if (!data) return null;
    if (Array.isArray(data)) {
      return data.map((user) => new UserDto(user));
    }
    return new UserDto(data);
  }
}
