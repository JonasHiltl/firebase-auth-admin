export interface UpdateRequest {
  /**
   * Whether or not the user is disabled: `true` for disabled;
   * `false` for enabled.
   */
  disabled?: boolean;

  /**
   * The user's display name.
   */
  displayName?: string | null;

  /**
   * The user's primary email.
   */
  email?: string;

  /**
   * Whether or not the user's primary email is verified.
   */
  emailVerified?: boolean;

  /**
   * The user's unhashed password.
   */
  password?: string;

  /**
   * The user's primary phone number.
   */
  phoneNumber?: string | null;

  /**
   * The user's photo URL.
   */
  photoUrl?: string | null;
}

export interface CreateRequest extends UpdateRequest {
  userID?: string;
}
