import { Base64 } from 'js-base64';

import { ONE_HOUR_IN_SECONDS } from './config';
import { FirebaseError } from './models/firebaseError';
import { ServiceAccountSigner } from './tokenSigner';

export const BLACKLISTED_CLAIMS = [
  'acr',
  'amr',
  'at_hash',
  'aud',
  'auth_time',
  'azp',
  'cnf',
  'c_hash',
  'exp',
  'iat',
  'iss',
  'jti',
  'nbf',
  'nonce',
];

const FIREBASE_AUDIENCE =
  'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit';

/**
 * Represents the header of a JWT.
 */
interface JWTHeader {
  alg: string;
  typ: string;
}

/**
 * Represents the body of a JWT.
 */
interface JWTBody {
  claims?: Record<string, unknown>;
  uid: string;
  aud: string;
  iat: number;
  exp: number;
  iss: string;
  sub: string;
  tenant_id?: string;
}

export class TokenGenerator {
  constructor(private readonly signer: ServiceAccountSigner) {}

  public async createCustomToken(
    userID: string,
    developerClaims?: { [key: string]: unknown },
  ): Promise<string> {
    if (!userID) {
      throw new FirebaseError({
        code: 400,
        message: '`userID` argument must be a non-empty string.',
      });
    }

    const claims: { [key: string]: unknown } = {};
    if (developerClaims) {
      for (const key in developerClaims) {
        if (Object.prototype.hasOwnProperty.call(developerClaims, key)) {
          if (BLACKLISTED_CLAIMS.indexOf(key) !== -1) {
            throw new FirebaseError({
              code: 400,
              status: 'INVALID_ARGUMENT',
              message: `Developer claim "${key}" is reserved and cannot be specified.`,
            });
          }
          claims[key] = developerClaims[key];
        }
      }
    }

    const account = this.signer.getAccountId();

    const header: JWTHeader = {
      alg: this.signer.algorithm,
      typ: 'JWT',
    };
    const iat = Math.floor(Date.now() / 1000);
    const body: JWTBody = {
      aud: FIREBASE_AUDIENCE,
      iat,
      exp: iat + ONE_HOUR_IN_SECONDS,
      iss: account,
      sub: account,
      uid: userID,
    };
    if (Object.keys(claims).length > 0) {
      body.claims = claims;
    }

    const b64Header = Base64.encodeURI(JSON.stringify(header));
    const b64Payload = Base64.encodeURI(JSON.stringify(body));

    const textEncoder = new TextEncoder();
    const inputArrayBuffer = textEncoder.encode(`${b64Header}.${b64Payload}`);

    const { signature } = await this.signer.sign(inputArrayBuffer);

    return `${b64Header}.${b64Payload}.${signature}`;
  }
}
