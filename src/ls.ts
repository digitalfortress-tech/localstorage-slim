/*
 * https://github.com/niketpathak/localstorage-slim
 * Copyright (c) 2021 Niket Pathak
 * MIT License
 */

import { isObject, NOOP, memoryStore } from './helpers';
import type { Encrypter, Decrypter, StorageConfig } from './types';

// private fields
let isInit = false;
let storage: Storage;

const init = () => {
  if (isInit) return;
  isInit = true;
  storage = config.storage || localStorage;
  try {
    // sometimes localStorage/sessionStorage is blocked due to security policy. For example, within JS fiddle in incognito mode
    storage.getItem('');
  } catch {
    storage = memoryStore();
  }

  flush();
};

// Apex
const APX = String.fromCharCode(0);

// tiny obsfuscator as a default implementation
const encrypter: Encrypter | Decrypter = (str, key, encrypt = true) =>
  encrypt
    ? [...(JSON.stringify(str) as unknown as string[])]
      .map((x) => String.fromCharCode(x.charCodeAt(0) + (key as number)))
      .join('')
    : JSON.parse([...(str as string[])].map((x) => String.fromCharCode(x.charCodeAt(0) - (key as number))).join(''));

const decrypter: Decrypter = (str, key) => {
  return encrypter(str, key, false);
};

const config: StorageConfig = {
  ttl: null,
  encrypt: false,
  encrypter,
  decrypter,
  secret: 75,
  storage: undefined,
};

Object.seal(config);

const set = <T = unknown>(key: string, value: T, localConfig: StorageConfig = {}): void | boolean => {
  init();

  const _conf = {
    ...config,
    ...localConfig,
    encrypt: localConfig.encrypt === false ? false : localConfig.encrypt || config.encrypt,
    ttl: localConfig.ttl === null ? null : localConfig.ttl || config.ttl,
  };

  try {
    const hasTTL = _conf.ttl && !isNaN(_conf.ttl) && _conf.ttl > 0;
    let val = hasTTL ? { [APX]: value, ttl: Date.now() + (_conf.ttl as number) * 1e3 } : value;

    if (_conf.encrypt) {
      // if ttl exists, only encrypt the value
      if (hasTTL) {
        (val as Record<string, unknown>)[APX] = (_conf.encrypter || NOOP)(
          (val as Record<string, unknown>)[APX],
          _conf.secret
        ) as string;
      } else {
        val = (_conf.encrypter || NOOP)(val, _conf.secret) as T;
      }
    }

    storage.setItem(key, JSON.stringify(val));
  } catch {
    // Sometimes stringify fails due to circular refs
    return false;
  }
};

const get = <T = unknown>(key: string, localConfig: StorageConfig = {}): T | null => {
  init();

  const str = storage.getItem(key);

  if (!str) {
    return null;
  }

  const _conf = {
    ...config,
    ...localConfig,
    encrypt: localConfig.encrypt === false ? false : localConfig.encrypt || config.encrypt,
    ttl: localConfig.ttl === null ? null : localConfig.ttl || config.ttl,
  };

  let item;
  let hasTTL;

  try {
    item = JSON.parse(str);
    hasTTL = isObject(item) && APX in item;

    if (_conf.decrypt || _conf.encrypt) {
      if (hasTTL) {
        item[APX] = (_conf.decrypter || NOOP)(item[APX], _conf.secret) as string;
      } else {
        item = (_conf.decrypter || NOOP)(item, _conf.secret) as string;
      }
    }
  } catch {
    // Either the secret is incorrect or there was a parsing error
    // do nothing [i.e. return the encrypted/unparsed value]
  }

  // if not using ttl, return immediately
  if (!hasTTL) {
    return item;
  }

  if (Date.now() > item.ttl) {
    storage.removeItem(key);
    return null;
  }

  return item[APX];
};

const flush = (force = false): void => {
  init();
  for (const key of Object.keys(storage)) {
    const str = storage.getItem(key);
    if (!str) return; // continue iteration
    let item;
    try {
      item = JSON.parse(str);
    } catch {
      // Some packages write strings to localStorage that are not converted by JSON.stringify(), so we need to ignore it
      return;
    }
    // flush only if ttl was set and is/is not expired
    if (isObject(item) && APX in item && (Date.now() > item.ttl || force)) {
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
