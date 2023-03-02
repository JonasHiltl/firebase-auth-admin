import { Base64 } from 'js-base64';

export class ServiceAccount {
  private cachedPrivateKey?: CryptoKey;

  constructor(
    private readonly projectID: string,
    private readonly privateKeyID: string,
    private readonly privateKey: string,
    private readonly clientEmail: string,
  ) {}

  public getPrivateKeyID(): string {
    return this.privateKeyID;
  }

  public getProjectID(): string {
    return this.projectID;
  }

  public getClientEmail(): string {
    return this.clientEmail;
  }

  public async getPrivateKey(): Promise<CryptoKey> {
    if (this.cachedPrivateKey) {
      return this.cachedPrivateKey;
    }

    // For some reason when locally running, the private key (specified in wrangler var) has line breaks defined with \\n.
    const pem = this.privateKey.replace(/(\r\n|\n|\\n|\r)/gm, '');
    const pemHeader = '-----BEGIN PRIVATE KEY-----';
    const pemFooter = '-----END PRIVATE KEY-----';

    if (!pem.startsWith(pemHeader) || !pem.endsWith(pemFooter)) {
      throw new Error('Invalid service account private key');
    }

    const pemContents = pem.substring(
      pemHeader.length,
      pem.length - pemFooter.length,
    );

    const buffer = Base64.toUint8Array(pemContents);

    const algorithm = {
      name: 'RSASSA-PKCS1-v1_5',
      hash: {
        name: 'SHA-256',
      },
    };

    const extractable = false;
    const keyUsages = ['sign'];

    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      buffer,
      algorithm,
      extractable,
      keyUsages,
    );
    this.cachedPrivateKey = privateKey;
    return privateKey;
  }
}
