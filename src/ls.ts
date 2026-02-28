/*
 * https://github.com/niketpathak/localstorage-slim
 * Copyright (c) 2021 Niket Pathak
 * MIT License
 */

import { isObject, memoryStore } from './helpers';
import type { Encrypter, Decrypter, StorageConfig } from './types';

// private fields
let isInit: boolean;
let storage: Storage;

const init = () => {
  if (isInit) return;
  isInit = true;
  try {
    // sometimes localStorage/sessionStorage is blocked due to security policy. For example, within JS fiddle in incognito mode
    storage = config.storage || localStorage;
    storage.getItem('');
  } catch {
    storage = memoryStore();
  }

  flush();
};

// Apex
const APX = String.fromCharCode(0);

// tiny obsfuscator as a default implementation
const shift = (s: string, offset: number): string => {
  let r = '';
  for (let i = 0; i < s.length; i++) r += String.fromCharCode(s.charCodeAt(i) + offset);
  return r;
};

const encrypter: Encrypter = (str, key) => shift(JSON.stringify(str), key as number);
const decrypter: Decrypter = (str, key) => JSON.parse(shift(str as string, -(key as number)));

const config: StorageConfig = {
  ttl: null,
  encrypt: false,
  encrypter,
  decrypter,
  secret: 75,
  storage: undefined,
};

Object.seal(config);

const set = <T = unknown>(key: string, value: T, localConfig: Omit<StorageConfig, 'storage'> = {}): void | boolean => {
  init();

  const encrypt = localConfig.encrypt ?? config.encrypt;
  const ttl = localConfig.ttl === null ? null : localConfig.ttl || config.ttl;

  try {
    const hasTTL = ttl && !isNaN(ttl) && ttl > 0;
    let val = hasTTL ? { [APX]: value, ttl: Date.now() + (ttl as number) * 1e3 } : value;

    if (encrypt) {
      const encrypterFn = (localConfig.encrypter || config.encrypter) as Encrypter;
      const secret = localConfig.secret ?? config.secret;
      if (hasTTL) {
        (val as Record<string, unknown>)[APX] = encrypterFn((val as Record<string, unknown>)[APX], secret);
      } else {
        val = encrypterFn(val, secret) as unknown as T;
      }
    }

    storage.setItem(key, JSON.stringify(val));
  } catch {
    // Sometimes stringify fails due to circular refs
    return false;
  }
};

const get = <T = unknown>(key: string, localConfig: Omit<StorageConfig, 'storage'> = {}): T | null => {
  init();

  const str = storage.getItem(key);

  const shouldDecrypt = localConfig.decrypt || (localConfig.encrypt ?? config.encrypt);

  let item;
  let hasTTL;

  try {
    item = JSON.parse(str || '');
    hasTTL = isObject(item) && APX in item;

    if (shouldDecrypt) {
      const decrypterFn = (localConfig.decrypter || config.decrypter) as Decrypter;
      const secret = localConfig.secret ?? config.secret;
      if (hasTTL) {
        item[APX] = decrypterFn(item[APX], secret) as string;
      } else {
        item = decrypterFn(item, secret) as string;
      }
    }
  } catch {
    // Either the secret is incorrect or there was a parsing error
    // do nothing [i.e. return the encrypted/unparsed value]
  }

  // if not using ttl, return immediately
  if (!hasTTL) {
    return (item !== undefined ? item : str) as T | null;
  }

  if (Date.now() > item.ttl) {
    storage.removeItem(key);
    return null;
  }

  return item[APX];
};

const flush = (force = false): void => {
  init();
  const now = Date.now();
  for (const key of Object.keys(storage)) {
    const str = storage.getItem(key);
    let item;
    try {
      item = JSON.parse(str || '');
    } catch {
      // Some packages write strings to localStorage that are not converted by JSON.stringify(), so we need to ignore it
      continue;
    }
    // flush only if ttl was set and is expired or is forced to clear
    if (isObject(item) && APX in item && (now > item.ttl || force)) {
      storage.removeItem(key);
    }
  }
};

const remove = (key: string): void => {
  init();
  storage.removeItem(key);
};

const clear = (): void => {
  init();
  storage.clear();
};

export default {
  config,
  set,
  get,
  flush,
  clear,
  remove,
};
