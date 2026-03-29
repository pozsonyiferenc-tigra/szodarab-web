interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

export async function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data
  }
  const data = await fetcher()
  store.set(key, { data, expiresAt: Date.now() + ttlMs })
  return data
}

export function invalidate(key: string) {
  store.delete(key)
}
