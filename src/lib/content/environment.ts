/**
 * Environment utilities for content loading system
 */
export const environment = {
  isDev: () => import.meta.env?.DEV ?? false,
  isProd: () => import.meta.env?.PROD ?? false,
  getMode: () => (import.meta.env?.DEV ? "development" : "production"),
  fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
};
