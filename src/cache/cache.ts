export interface PutParams {
  expiration?: number;
  expirationTtl?: number;
}

export interface Cache {
  put(key: string, value: unknown, params?: PutParams): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
}
