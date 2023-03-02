import { Cache } from './cache';
import { Config } from './config';
import { HttpClient } from './httpClient';
import { FirebaseError, FirebaseErrorResponse } from './models/firebaseError';
import { CreateRequest } from './models/requests';
import { DecodedIdToken } from './models/token';
import { GetAccountInfoUserResponse, UserRecord } from './models/user';
import { TokenGenerator } from './tokenGenerator';
import { ServiceAccountSigner } from './tokenSigner';
import { TokenVerifier } from './tokenVerifier';

export class FirebaseAuth {
  private client: HttpClient;
  private config: Config;

  private verifier: TokenVerifier;
  private generator: TokenGenerator;

  constructor(client: HttpClient, config: Config, cache?: Cache) {
    this.client = client;
    this.config = config;
    this.verifier = new TokenVerifier(cache);

    this.generator = new TokenGenerator(
      new ServiceAccountSigner(config.getServiceAccount()),
    );
  }

  public async createUser(request: CreateRequest): Promise<UserRecord> {
    type SignUpNewUserRequest = CreateRequest & {
      localId?: string;
    };
    const body: SignUpNewUserRequest = Object.assign({}, request);

    if (body.userID) {
      body.localId = body.userID;
      delete body.userID;
    }

    const response = await this.client.send({
      method: 'POST',
      path: `/projects/${this.config.getProjectID()}/accounts`,
      data: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json<FirebaseErrorResponse>();
      throw FirebaseError.fromServerError(err);
    }

    type SignupNewUserResponse = {
      kind: string;
      email: string;
      localId: string;
    };
    const token = await response.json<SignupNewUserResponse>();
    return this.getUser(token.localId);
  }

  public async getUser(userID: string): Promise<UserRecord> {
    const request = {
      localId: [userID],
    };

    const response = await this.client.send({
      method: 'POST',
      path: `/projects/${this.config.getProjectID()}/accounts:lookup`,
      data: JSON.stringify(request),
    });

    if (!response.ok) {
      const err = await response.json<FirebaseErrorResponse>();
      throw FirebaseError.fromServerError(err);
    }

    type UserResult = {
      users: GetAccountInfoUserResponse[];
    };

    const result = await response.json<UserResult>();

    return new UserRecord(result.users[0]);
  }

  public async signInWithCustomToken(
    token: string,
  ): Promise<{ idToken: string; refreshToken: string }> {
    const request = {
      returnSecureToken: true,
      token,
    };
    const response = await this.client.send({
      method: 'POST',
      path: `/accounts:signInWithCustomToken`,
      data: JSON.stringify(request),
    });

    if (!response.ok) {
      const err = await response.json<FirebaseErrorResponse>();
      throw FirebaseError.fromServerError(err);
    }
    type SignInWithCustomTokenResponse = {
      idToken: string;
      refreshToken: string;
      expiresIn: string;
      isNewUser: boolean;
    };

    const json = await response.json<SignInWithCustomTokenResponse>();
    return {
      idToken: json.idToken,
      refreshToken: json.refreshToken,
    };
  }

  public async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    return this.verifier.verifyIdToken(idToken) as Promise<DecodedIdToken>;
  }

  public async createCustomToken(
    userID: string,
    developerClaims?: { [key: string]: unknown },
  ): Promise<string> {
    return this.generator.createCustomToken(userID, developerClaims);
  }
}
