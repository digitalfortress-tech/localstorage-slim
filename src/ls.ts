/*
 * https://github.com/niketpathak/localstorage-slim
 * Copyright (c) 2021 Niket Pathak
 * MIT License
 */

import { isObject, NOOP } from './helpers';
import type { Encrypt, Encrypter, Decrypter, LocalStorageConfig } from './types';

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

// tiny obsfuscator
const obfus: Encrypter | Decrypter = (str, key, encrypt = true) => {
  const secret = key || config.global_encrypt?.secret;
  return encrypt
    ? [...(str as string[])].map((x) => String.fromCharCode(x.charCodeAt(0) + (secret as number))).join('')
    : [...(str as string[])].map((x) => String.fromCharCode(x.charCodeAt(0) - (secret as number))).join('');
};

const decrypter: Decrypter = (str, key) => {
  return obfus(str, key, false);
};

const config: LocalStorageConfig = {
  global_ttl: null,
  global_encrypt: {
    enable: false,
    encrypter: obfus,
    decrypter: decrypter,
    secret: 75,
  } as Encrypt,
};

const set = (key: string, value: unknown, ttl?: number, encrypt: Encrypt = {}): void | boolean => {
  if (!supportsLS) return false;

  const _ttl = ttl || config.global_ttl;
  const _encrypt = {
    ...config.global_encrypt,
    ...encrypt,
    ...{ enable: encrypt.enable === false ? false : encrypt.enable || config.global_encrypt?.enable },
  };

  try {
    let val = _ttl ? JSON.stringify({ [APX]: value, ttl: Date.now() + _ttl * 1e3 }) : JSON.stringify(value);
    if (_encrypt.enable) {
      val = (_encrypt.encrypter || NOOP)(val, _encrypt.secret) as string;
    }
    localStorage.setItem(key, val);
  } catch (e) {
    // Sometimes stringify fails due to circular refs
    return false;
  }
};

const get = (key: string, decrypt: Encrypt = {}): null | unknown => {
  if (!supportsLS) return null;

  let str = localStorage.getItem(key);

  if (!str) {
    return null;
  }

  const _decrypt = {
    ...config.global_encrypt,
    ...decrypt,
    enable: decrypt.enable === false ? false : decrypt.enable || config.global_encrypt?.enable,
  };

  if (_decrypt.enable) {
    str = (_decrypt.decrypter || NOOP)(str, _decrypt.secret) as string;
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

const clear = () => {
  // @todo: clear all storage
};

export const ls = {
  config,
  set,
  get,
  // flush,
  // clear,
};
