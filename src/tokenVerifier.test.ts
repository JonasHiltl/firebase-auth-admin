import { beforeEach, describe, expect, it } from 'vitest';

import { Cache, MapCache } from './cache';
import { CLIENT_CERT_CACHE_KEY, TokenVerifier } from './tokenVerifier';

describe('TokenVerifier', () => {
  let cache: Cache;
  let verifier: TokenVerifier;

  beforeEach(() => {
    verifier = new TokenVerifier(cache);
    cache = new MapCache();
  });

  it('Should save Certificate in cache', async () => {
    expect(verifier.verifyIdToken('algjli2j1op21')).rejects.toThrowError();
    expect(cache.get(CLIENT_CERT_CACHE_KEY)).toBeDefined();
  });

  // TODO: test verification with mock idToken
});
