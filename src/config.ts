import { Base64 } from 'js-base64';

import { Cache } from './cache';
import { FirebaseError } from './models/firebaseError';
import { ServiceAccount } from './serviceAccount';
import { CryptoSigner, ServiceAccountSigner } from './tokenSigner';

const GOOGLE_AUTH_TOKEN_HOST = 'accounts.google.com';
const GOOGLE_AUTH_TOKEN_PATH = '/o/oauth2/token';

const GOOGLE_TOKEN_AUDIENCE = 'https://accounts.google.com/o/oauth2/token';
export const ONE_HOUR_IN_SECONDS = 60 * 60;

const ACCESS_TOKEN_CACHE_KEY = 'access_token';

/**
 * Interface for Google OAuth 2.0 access tokens.
 */
interface GoogleOAuthAccessToken {
  access_token: string;
  expires_in: number;
}

/**
 * Type representing a Firebase OAuth access token (derived from a Google OAuth2 access token) which
 * can be used to authenticate to Firebase services such as the Realtime Database and Auth.
 */
interface FirebaseAccessToken {
  accessToken: string;
  expirationTime: number;
}

export class Config {
  private serviceAccount: ServiceAccount;
  private signer: CryptoSigner;
  private cache?: Cache;

  /**
   *
   * @param cache Used to cache the access token.
   * @param projectID The project id.
   * @param clientEmail The email of the service account
   * @param privateKey
   */
  constructor(serviceAccount: ServiceAccount, cache?: Cache) {
    this.serviceAccount = serviceAccount;
    this.cache = cache;
    this.signer = new ServiceAccountSigner(serviceAccount);
  }

  public getProjectID(): string {
    return this.serviceAccount.getProjectID();
  }

  public getServiceAccount(): ServiceAccount {
    return this.serviceAccount;
  }

  // https://github.com/firebase/firebase-admin-node/blob/7e529170934a23ea38394b10944621471e7e57bf/src/app/firebase-app.ts#L49
  public async getToken(forceRefresh = false): Promise<FirebaseAccessToken> {
    const TOKEN_EXPIRY_THRESHOLD_MILLIS = 5 * 60 * 1000;

    const cachedToken = await this.getCachedToken();

    if (
      forceRefresh ||
      !cachedToken ||
      cachedToken.expirationTime - Date.now() <= TOKEN_EXPIRY_THRESHOLD_MILLIS
    ) {
      return this.refreshToken();
    }

    return Promise.resolve(cachedToken);
  }

  private async refreshToken(): Promise<FirebaseAccessToken> {
    const result = await this.getAccessToken();

    const token: FirebaseAccessToken = {
      accessToken: result.access_token,
      expirationTime: Date.now() + result.expires_in * 1000,
    };

    const cachedToken = await this.getCachedToken();

    if (
      cachedToken?.accessToken !== token.accessToken &&
      cachedToken?.expirationTime !== token.expirationTime
    ) {
      await this.setCachedToken(token);
    }
    return token;
  }

  private async getAccessToken(): Promise<GoogleOAuthAccessToken> {
    const token = await this.createAuthJwt();

    const postData =
      'grant_type=urn%3Aietf%3Aparams%3Aoauth%3A' +
      'grant-type%3Ajwt-bearer&assertion=' +
      token;

    const response = await fetch(
      `https://${GOOGLE_AUTH_TOKEN_HOST}${GOOGLE_AUTH_TOKEN_PATH}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: postData,
      },
    );
    if (!response.ok) {
      throw response.json<FirebaseError>();
    }
    return response.json();
  }

  private async createAuthJwt(): Promise<string> {
    const scope = [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/identitytoolkit',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' ');

    const header = Base64.encodeURI(
      JSON.stringify({
        alg: 'RS256',
        typ: 'JWT',
        kid: this.serviceAccount.getPrivateKeyID,
      }),
    );

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + ONE_HOUR_IN_SECONDS;

    const payload = Base64.encodeURI(
      JSON.stringify({
        iss: this.serviceAccount.getClientEmail(),
        sub: this.serviceAccount.getClientEmail(),
        aud: GOOGLE_TOKEN_AUDIENCE,
        exp,
        iat,
        scope,
      }),
    );

    const textEncoder = new TextEncoder();
    const inputArrayBuffer = textEncoder.encode(`${header}.${payload}`);

    const { signature } = await this.signer.sign(inputArrayBuffer);

    return `${header}.${payload}.${signature}`;
  }

  private async getCachedToken(): Promise<FirebaseAccessToken | null> {
    const result = await this.cache?.get<string>(ACCESS_TOKEN_CACHE_KEY);
    if (result) {
      return JSON.parse(result);
    } else {
      return null;
    }
  }

  private async setCachedToken(token: FirebaseAccessToken): Promise<void> {
    return await this.cache?.put(ACCESS_TOKEN_CACHE_KEY, JSON.stringify(token));
  }

  private async deleteCachedToken(): Promise<void> {
    return await this.cache?.delete(ACCESS_TOKEN_CACHE_KEY);
  }
}
