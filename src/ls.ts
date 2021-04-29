/*
 * https://github.com/niketpathak/localstorage-slim
 * Copyright (c) 2021 Niket Pathak
 * MIT License
 */

import { isObject, NOOP } from './helpers';
import type { Encrypter, Decrypter, LocalStorageConfig } from './types';

// Flags
let flushOnInit = true;

const supportsLS = (): boolean => {
  try {
    if (!localStorage) {
      return false;
    }
  } catch (e) {
    // some browsers throw an error if you try to access local storage (e.g. brave browser)
    // and some like Safari do not allow access to LS in incognito mode
    return false;
  }

  // flush once on init
  if (flushOnInit) {
    flushOnInit = false;
    flush();
  }

  return true;
};

// Apex
const APX = String.fromCharCode(0);

// tiny obsfuscator
const obfus: Encrypter | Decrypter = (str, key, encrypt = true) =>
  encrypt
    ? [...(str as string[])].map((x) => String.fromCharCode(x.charCodeAt(0) + (key as number))).join('')
    : [...(str as string[])].map((x) => String.fromCharCode(x.charCodeAt(0) - (key as number))).join('');

const decrypter: Decrypter = (str, key) => {
  return obfus(str, key, false);
};

const config: LocalStorageConfig = {
  ttl: null,
  encrypt: false,
  encrypter: obfus,
  decrypter: decrypter,
  secret: 75,
};

const set = <T = unknown>(key: string, value: T, localConfig: LocalStorageConfig = {}): void | boolean => {
  if (!supportsLS()) return false;

  const _conf = {
    ...config,
    ...localConfig,
    encrypt: localConfig.encrypt === false ? false : localConfig.encrypt || config.encrypt,
    ttl: localConfig.ttl === null ? null : localConfig.ttl || config.ttl,
  };

  try {
    let val = _conf.ttl && _conf.ttl > 0 ? { [APX]: value, ttl: Date.now() + _conf.ttl * 1e3 } : value;

    if (_conf.encrypt) {
      // if ttl exists, only encrypt the value
      if (_conf.ttl && APX in (val as Record<string, unknown>)) {
        (val as Record<string, unknown>)[APX] = (_conf.encrypter || NOOP)(
          (val as Record<string, unknown>)[APX],
          _conf.secret
        ) as string;
      } else {
        val = (_conf.encrypter || NOOP)(val, _conf.secret) as T;
      }
    }

    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    // Sometimes stringify fails due to circular refs
    return false;
  }
};

const get = <T = unknown>(key: string, localConfig: LocalStorageConfig = {}): T | null => {
  if (!supportsLS()) return null;

  const str = localStorage.getItem(key);

  if (!str) {
    return null;
  }

  const _conf = {
    ...config,
    ...localConfig,
    encrypt: localConfig.encrypt === false ? false : localConfig.encrypt || config.encrypt,
    ttl: localConfig.ttl === null ? null : localConfig.ttl || config.ttl,
  };

  let item = JSON.parse(str);
  const hasTTL = isObject(item) && APX in item;

  if (_conf.encrypt) {
    if (hasTTL) {
      item[APX] = (_conf.decrypter || NOOP)(item[APX], _conf.secret) as string;
    } else {
      item = (_conf.decrypter || NOOP)(item, _conf.secret) as string;
    }
  }

  // if not using ttl, return immediately
  if (!hasTTL) {
    return item;
  }

  if (Date.now() > item.ttl) {
    localStorage.removeItem(key);
    return null;
  }

  return item[APX];
};

const flush = (force = false): false | void => {
  if (!supportsLS()) return false;
  Object.keys(localStorage).forEach((key) => {
    const str = localStorage.getItem(key);
    if (!str) return; // continue iteration
    const item = JSON.parse(str);
    // flush only if ttl was set and is/is not expired
    if (isObject(item) && APX in item && (Date.now() > item.ttl || force)) {
      localStorage.removeItem(key);
    }
  });
};

const remove = (key: string): undefined | false => {
  if (!supportsLS()) return false;
  localStorage.removeItem(key);
};

const clear = (): undefined | false => {
  if (!supportsLS()) return false;
  localStorage.clear();
};

export const ls = {
  config,
  set,
  get,
  flush,
  clear,
  remove,
};
