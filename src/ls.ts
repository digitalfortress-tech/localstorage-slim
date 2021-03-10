/*
 * https://github.com/niketpathak/localstorage-slim
 * Copyright (c) 2021 Niket Pathak
 * MIT License
 */

import { isObject, NOOP } from './helpers';
import type { Encrypter, Decrypter, LocalStorageConfig } from './types';

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
  enableEncryption: false,
  encrypter: obfus,
  decrypter: decrypter,
  secret: 75,
};

const set = (key: string, value: unknown, localConfig: LocalStorageConfig = {}): void | boolean => {
  if (!supportsLS) return false;

  const _conf = {
    ...config,
    ...localConfig,
    enableEncryption:
      localConfig.enableEncryption === false ? false : localConfig.enableEncryption || config.enableEncryption,
    ttl: localConfig.ttl === null ? null : localConfig.ttl || config.ttl,
  };

  try {
    let val =
      _conf.ttl && _conf.ttl > 0
        ? JSON.stringify({ [APX]: value, ttl: Date.now() + _conf.ttl * 1e3 })
        : JSON.stringify(value);

    if (_conf.enableEncryption) {
      val = (_conf.encrypter || NOOP)(val, _conf.secret) as string;
    }

    localStorage.setItem(key, val);
  } catch (e) {
    // Sometimes stringify fails due to circular refs
    return false;
  }
};

const get = (key: string, localConfig: LocalStorageConfig = {}): null | unknown => {
  if (!supportsLS) return null;

  let str = localStorage.getItem(key);

  if (!str) {
    return null;
  }

  const _conf = {
    ...config,
    ...localConfig,
    enableEncryption:
      localConfig.enableEncryption === false ? false : localConfig.enableEncryption || config.enableEncryption,
    ttl: localConfig.ttl === null ? null : localConfig.ttl || config.ttl,
  };

  if (_conf.enableEncryption) {
    str = (_conf.decrypter || NOOP)(str, _conf.secret) as string;
  }

  const item = JSON.parse(str);

  // if not using ttl, return immediately
  if (!isObject(item) || (isObject(item) && !(APX in item))) {
    return item;
  }

  if (Date.now() > item.ttl) {
    localStorage.removeItem(key);
    return null;
  }

  return item[APX];
};

const flush = () => {
  if (!supportsLS) return false;
  // @todo: implement flush
};

const remove = (key: string): undefined | false => {
  if (!supportsLS) return false;
  localStorage.removeItem(key);
};

const clear = (): undefined | false => {
  if (!supportsLS) return false;
  localStorage.clear();
};

export const ls = {
  config,
  set,
  get,
  // flush,
  clear,
  remove,
};
