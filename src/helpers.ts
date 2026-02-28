import type { Dictionary } from './types';

export const NOOP = (...args: unknown[]): unknown => undefined;

export const isObject = (item: any): boolean => typeof item === 'object' && item !== null && !Array.isArray(item);

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
