import { cache as reactCache } from "react";

/**
 * Type for a suspense resource that follows the standard React suspense pattern
 */
export interface SuspenseResource<T> {
  read(): T;
}

/**
 * Simple cache for suspense resources
 */
const resourceCache = new Map<string, SuspenseResource<any>>();

/**
 * Creates a suspense resource that can be used with React Suspense
 *
 * @param key - Unique cache key for this resource
 * @param fetcher - Async function that fetches the data
 * @returns A resource with a read() method that follows the React suspense pattern
 */
export function createSuspenseResource<T>(
  key: string,
  fetcher: () => Promise<T>
): SuspenseResource<T> {
  if (!resourceCache.has(key)) {
    let data: T | null = null;
    let error: Error | null = null;
    let promise: Promise<void> | null = null;

    const resource = {
      read() {
        if (error) throw error;
        if (data) return data;
        if (!promise) {
          promise = fetcher()
            .then((result) => {
              data = result;
            })
            .catch((e) => {
              error = e instanceof Error ? e : new Error(String(e));
            });
        }
        throw promise;
      },
    };

    resourceCache.set(key, resource);
  }

  return resourceCache.get(key)!;
}

/**
 * React Cache version of createSuspenseResource that uses React's built-in cache
 * This is the preferred way to create suspense resources when using React 18+
 */
export const createCachedResource = reactCache(
  async <T>(_: string, fetcher: () => Promise<T>): Promise<T> => {
    // This will be cached by React's built-in cache
    return await fetcher();
  }
);
