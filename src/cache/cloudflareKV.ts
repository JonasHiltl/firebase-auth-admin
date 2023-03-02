import { Cache, PutParams } from './cache';

export class CloudflareKv implements Cache {
  private namespace: KVNamespace;
  constructor(namespace: KVNamespace) {
    this.namespace = namespace;
  }

  get<T>(key: string): Promise<T | null> {
    return this.namespace.get(key) as Promise<T | null>;
  }

  put(key: string, value: string, params?: PutParams): Promise<void> {
    return this.namespace.put(key, value, {
      ...(params?.expiration && { expiration: params.expiration }),
      ...(params?.expirationTtl && { expirationTtl: params.expirationTtl }),
    });
  }

  delete(key: string): Promise<void> {
    return this.namespace.delete(key);
  }
}
