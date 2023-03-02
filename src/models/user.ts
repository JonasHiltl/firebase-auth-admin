import { FirebaseError } from './firebaseError';

export interface GetAccountInfoUserResponse {
  localId: string;
  email?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  displayName?: string;
  photoUrl?: string;
  disabled?: boolean;
  passwordHash?: string;
  salt?: string;
  customAttributes?: string;
  validSince?: string;
  tenantId?: string;
  createdAt?: string;
  lastLoginAt?: string;
  lastRefreshAt?: string;
  [key: string]: unknown;
}
/**
 * Represents a user.
 */
export class UserRecord {
  /**
   * The user's `uid`.
   */
  public readonly userID: string;

  /**
   * The user's primary email, if set.
   */
  public readonly email?: string;

  /**
   * Whether or not the user's primary email is verified.
   */
  public readonly emailVerified: boolean;

  /**
   * The user's display name.
   */
  public readonly displayName?: string;

  /**
   * The user's photo URL.
   */
  public readonly photoUrl?: string;

  /**
   * The user's primary phone number, if set.
   */
  public readonly phoneNumber?: string;

  /**
   * Whether or not the user is disabled: `true` for disabled; `false` for
   * enabled.
   */
  public readonly disabled: boolean;

  /**
   * The user's hashed password (base64-encoded), only if Firebase Auth hashing
   * algorithm (SCRYPT) is used. If a different hashing algorithm had been used
   * when uploading this user, as is typical when migrating from another Auth
   * system, this will be an empty string. If no password is set, this is
   * null. This is only available when the user is obtained from
   * {@link BaseAuth.listUsers}.
   */
  public readonly passwordHash?: string;

  /**
   * The user's password salt (base64-encoded), only if Firebase Auth hashing
   * algorithm (SCRYPT) is used. If a different hashing algorithm had been used to
   * upload this user, typical when migrating from another Auth system, this will
   * be an empty string. If no password is set, this is null. This is only
   * available when the user is obtained from {@link BaseAuth.listUsers}.
   */
  public readonly passwordSalt?: string;

  /**
   * The user's custom claims object if available, typically used to define
   * user roles and propagated to an authenticated user's ID token.
   * This is set via {@link BaseAuth.setCustomUserClaims}
   */
  public readonly customClaims?: { [key: string]: unknown };

  /**
   * The ID of the tenant the user belongs to, if available.
   */
  public readonly tenantId?: string | null;

  constructor(response: GetAccountInfoUserResponse) {
    // The Firebase user id is required.
    if (!response.localId) {
      throw new FirebaseError({
        code: 500,
        status: 'INTERNA_ERROR',
        message: 'INTERNAL ASSERT FAILED: Invalid user response',
      });
    }

    this.userID = response.localId;
    this.email = response.email;
    this.emailVerified = !!response.emailVerified;
    this.displayName = response.displayName;
    this.photoUrl = response.photoUrl;
    this.phoneNumber = response.phoneNumber;
    this.disabled = response.disabled || false;
    this.passwordHash = response.passwordHash;
    this.passwordSalt = response.salt;
    this.tenantId = response.tenantId;
    if (response.customAttributes) {
      this.customClaims = JSON.parse(response.customAttributes);
    }
  }

  /**
   * Returns a JSON-serializable representation of this object.
   *
   * @returns A JSON-serializable representation of this object.
   */
  public toJSON(): Record<string, unknown> {
    return {
      userID: this.userID,
      email: this.email,
      emailVerified: this.emailVerified,
      displayName: this.displayName,
      photoURL: this.photoUrl,
      phoneNumber: this.phoneNumber,
      disabled: this.disabled,
      passwordHash: this.passwordHash,
      passwordSalt: this.passwordSalt,
      customClaims: this.customClaims,
      tenantId: this.tenantId,
    };
  }
}
