import { decodeProtectedHeader, importX509, JWTPayload, jwtVerify } from 'jose';

import { Cache } from './cache';
import { FirebaseError } from './models/firebaseError';

const CLIENT_CERT_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
export const CLIENT_CERT_CACHE_KEY = 'google_client_cert';

type CertResponse = { [key: string]: string };

export class TokenVerifier {
  cache?: Cache;

  constructor(cache?: Cache) {
    this.cache = cache;
  }

  public async verifyIdToken(idToken: string): Promise<JWTPayload> {
    let tokens = await this.getCachedCert();

    if (!tokens) {
      const response = await fetch(CLIENT_CERT_URL);
      if (!response.ok) {
        throw new FirebaseError({
          code: 500,
          message: 'Failed to fetch Google client certificates.',
        });
      }

      tokens = await response.json<CertResponse>();

      const cc = response.headers.get('cache-control');
      if (cc !== null) {
        const parts = cc.split(',');
        parts.forEach(part => {
          const subParts = part.trim().split('=');
          if (subParts[0] === 'max-age' && tokens) {
            const maxAge: number = +subParts[1];
            const expiration = Date.now() + maxAge * 1000;
            const padded = expiration.toString().substring(0, 10);
            this.setCachedCert(tokens, parseInt(padded));
          }
        });
      }
    }

    //Get the correct publicKey from the key id
    const header = decodeProtectedHeader(idToken);
    if (!header.kid) {
      throw new FirebaseError({
        code: 403,
        message: 'kid does not exist on provided ID Token.',
      });
    }
    const certificate = tokens[header.kid];
    const publicKey = await importX509(certificate, 'RS256');

    //Verify JWT with public key
    const { payload } = await jwtVerify(idToken, publicKey);
    return payload;
  }

  private async setCachedCert(cert: CertResponse, expiration: number) {
    await this.cache?.put(CLIENT_CERT_CACHE_KEY, JSON.stringify(cert), {
      expiration,
    });
  }

  private async getCachedCert(): Promise<CertResponse | null> {
    const cachedCert = await this.cache?.get<string>(CLIENT_CERT_CACHE_KEY);
    if (cachedCert) {
      return JSON.parse(cachedCert);
    } else {
      return null;
    }
  }
}
