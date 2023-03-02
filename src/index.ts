export { FirebaseAuth } from './auth';
export { CloudflareKv } from './cache';
export { FirebaseError } from './models/firebaseError';
export { ServiceAccount } from './serviceAccount';

import { FirebaseAuth } from './auth';
import { Cache } from './cache';
import { Config } from './config';
import { AuthorizedHttpClient } from './httpClient';
import { ServiceAccount } from './serviceAccount';

export const initializeAuth = (
  serviceAccount: ServiceAccount,
  cache?: Cache,
): FirebaseAuth => {
  const config = new Config(serviceAccount, cache);
  const client = new AuthorizedHttpClient(config);
  return new FirebaseAuth(client, config, cache);
};
