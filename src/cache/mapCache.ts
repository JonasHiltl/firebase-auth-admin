import { Cache } from './cache';

/**
 * A simple wrapper around a Map, which implements the Cache interface.
 * It ignores the `PutParams` on the `put` operation.
 */
export class MapCache implements Cache {
  map = new Map();

  get<T>(key: string): Promise<T | null> {
    return Promise.resolve(this.map.get(key));
  }

  put(key: string, value: string): Promise<void> {
    this.map.set(key, value);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.map.delete(key);
    return Promise.resolve();
  }
}
