/*
 * https://github.com/niketpathak/localstorage-slim
 * Copyright (c) 2021 Niket Pathak
 * MIT License
 */

import { isObject } from './helpers';
import type { Encrypter, Decrypter, LocalStorageConfig } from './types';

const supportsLS = (): boolean => {
  try {
    if (!localStorage) {
      return false;
    }
  } catch (e) {
    // some browsers throw an error if you try to access local storage (e.g. brave browser)
    return false;
  }
  return true;
};

// Apex
const APX = String.fromCharCode(0);

// plain obsfuscation
const obfus: Encrypter | Decrypter = (str, key, encrypt = true) => {
  const secret = key || config.global_encrypt?.secret;
  let item;
  if (encrypt) {
    item = window.btoa(str as string);
    return [...item].map(x => (String.fromCharCode(x.charCodeAt(0) + (secret as number)))).join('');
  } else {
    item = [...str as string[]].map(x => (String.fromCharCode(x.charCodeAt(0) - (secret as number)))).join('');
    return window.atob(item as string);
  }
}

const encrypter: Encrypter = obfus;
const decrypter: Decrypter = (str, key) => {
  return obfus(str, key, false);
};

const config: LocalStorageConfig = {
  global_ttl: null,
  global_encrypt: {
    enable: false,
    encrypter: encrypter,
    decrypter: decrypter,
    secret: 75,
  },
};

const set = (key: string, value: unknown, ttl?: number): void | boolean => {
  if (!supportsLS) return false;

  const _ttl = ttl || config.global_ttl;

  try {
    let val = _ttl ? JSON.stringify({ [APX]: value, ttl: Date.now() + _ttl * 1e3 }) : JSON.stringify(value);
    if (config.global_encrypt?.enable) {
      val = config.global_encrypt.encrypter(val);
    }
    localStorage.setItem(key, val);
  } catch (e) {
    // Sometimes stringify fails due to circular refs
    return false;
  }
};

const get = (key: string): null | unknown => {
  if (!supportsLS) return null;

  let str = localStorage.getItem(key);

  if (!str) {
    return null;
  }

  if (config.global_encrypt?.enable) {
    str = config.global_encrypt.decrypter(str as string);
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

export const ls = {
  config,
  set,
  get,
  // flush,
};
