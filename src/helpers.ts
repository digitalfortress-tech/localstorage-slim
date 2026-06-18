import type { Dictionary } from './types';

export const isObject = (item: unknown): boolean => typeof item === 'object' && item !== null && !Array.isArray(item);

// Apex — sentinel key marking a library-managed TTL wrapper: `{ [APX]: value, ttl: <epoch ms> }`
export const APX = String.fromCharCode(0);

/**
 * A genuine TTL wrapper is an object that carries the APX sentinel key AND a numeric `ttl`.
 * Requiring `ttl` to be a number prevents `flush(true)` and `get()` from mistaking a plain user
 * object that merely happens to contain the sentinel key for a library-managed TTL entry.
 */
export const isTTLWrapper = (item: unknown): boolean =>
  isObject(item) && APX in (item as Dictionary) && typeof (item as Dictionary).ttl === 'number';

/** Specific to local-storage */

export const memoryStore = (): Storage => {
  // @deprecated @todo: remove usage in v3. Export it and allow enduser to implement it themselves if need be
  // because as of Feb 2023 ALL webbrowsers support LS (even in incognito mode)
  // thrown error is generally due to a security policy (or perhaps exceeding storage capacity)
  const mStore = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key];
    },
  };

  const store: Dictionary = Object.create(mStore);

  return store as Storage;
};
