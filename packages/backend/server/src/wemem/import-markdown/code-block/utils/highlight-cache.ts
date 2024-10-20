import type { ThemedToken } from 'shiki';

class LRUCache<K, V> {
  private readonly cache: Map<K, V>;

  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key: K): V | null {
    const value = this.cache.get(key);
    if (value === undefined) {
      return null;
    }
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

export type highlightCacheKey = `${string}-${string}-${string}`;

export const highlightCache = new LRUCache<
  highlightCacheKey,
  Omit<ThemedToken, 'offset'>[]
>(4000);
