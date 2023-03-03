export interface DecodedIdToken {
  aud: string;
  auth_time: number;
  email?: string;
  email_verified?: boolean;
  exp: number;
  firebase: {
    identities: {
      [key: string]: unknown;
    };
    sign_in_provider: string;
    sign_in_second_factor?: string;
    second_factor_identifier?: string;
    tenant?: string;
    [key: string]: unknown;
  };
  iat: number;
  iss: string;
  phone_number?: string;
  picture?: string;
  sub: string;
  uid: string;
  [key: string]: unknown;
}

export interface IdTokenResponse {
  localId: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn?: string;
  providerId?: string;

  emailVerified: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName?: string | null;
  isNewUser?: boolean;
  kind?: string;
  photoUrl?: string | null;
  rawUserInfo?: string;
  screenName?: string | null;
}
