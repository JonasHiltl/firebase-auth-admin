import { Base64 } from 'js-base64';

import { ServiceAccount } from './serviceAccount';

const ALGORITHM_RS256 = 'RS256';

/**
 * CryptoSigner interface represents an object that can be used to sign JWTs.
 */
export interface CryptoSigner {
  /**
   * The name of the signing algorithm.
   */
  readonly algorithm: string;

  /**
   * Cryptographically signs a buffer of data.
   *
   * @param buffer - The data to be signed.
   * @returns A promise that resolves with the raw bytes of a signature.
   */
  sign(buffer: Uint8Array): Promise<{
    signature: string;
    output: ArrayBuffer;
  }>;

  getAccountId(): string;
}

// https://github.com/firebase/firebase-admin-node/blob/master/src/utils/crypto-signer.ts#L59
export class ServiceAccountSigner implements CryptoSigner {
  algorithm = ALGORITHM_RS256;

  constructor(private readonly serviceAccount: ServiceAccount) {}

  public getAccountId(): string {
    return this.serviceAccount.getClientEmail();
  }

  public async sign(input: Uint8Array): Promise<{
    signature: string;
    output: ArrayBuffer;
  }> {
    const privateKey = await this.serviceAccount.getPrivateKey();
    const output = await crypto.subtle.sign(
      { name: 'RSASSA-PKCS1-v1_5' },
      privateKey,
      input,
    );

    const signature = Base64.fromUint8Array(new Uint8Array(output), true);

    return { signature, output };
  }
}
