interface CacheEntry<TValue> {
  value: TValue
  expiresAt: number
}

export class MemoryCache<TValue> {
  #entries = new Map<string, CacheEntry<TValue>>()

  get(key: string) {
    const entry = this.#entries.get(key)
    if (!entry) return null

    if (entry.expiresAt <= Date.now()) {
      this.#entries.delete(key)
      return null
    }

    return entry.value
  }

  set(key: string, value: TValue, ttlMs: number) {
    this.#entries.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    })
  }
}
