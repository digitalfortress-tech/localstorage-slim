import type { Dictionary } from './types';

export const NOOP = (...args: unknown[]): unknown => undefined;

export const escapeRegExp = (text: string): string => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

export const isObject = (item: any): boolean => {
  return item !== null && item.constructor.name === 'Object';
};

/** Specific to local-storage */

export const memoryStore = (): Storage => {
  // @deprecated @todo: remove in v3. Allow enduser to implement it themselves if need be
  // because as of Feb 2023 ALL webbrowsers support LS (even in incognito mode)
  // thrown error is generally due to a security policy (or exceeding storage capacity)
  const mStore = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      store[key] = undefined;
    },
    clear: () => {
      store = {
        __proto__: mStore,
      };
    },
  };

  let store: Dictionary = {
    __proto__: mStore,
  };

  return store as Storage;
};
