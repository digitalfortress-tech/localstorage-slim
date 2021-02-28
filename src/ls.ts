/*
 * https://github.com/niketpathak/localstorage-slim
 * Copyright (c) 2021 Niket Pathak
 * MIT License
 */

import { isObject } from './helpers';
import type { LocalStorageConfig } from './types';

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
const APX = String.fromCharCode(7e3);

const config: LocalStorageConfig = {
  global_ttl: null,
};

const set = (key: string, value: unknown, ttl?: number): void | boolean => {
  if (!supportsLS) return false;

  const _ttl = ttl || config.global_ttl;

  try {
    const val = _ttl ? JSON.stringify({ [APX]: value, ttl: Date.now() + _ttl * 1e3 }) : JSON.stringify(value);
    localStorage.setItem(key, val);
  } catch (e) {
    // Sometimes stringify fails due to circular refs
    return false;
  }
};

const get = (key: string): null | unknown => {
  if (!supportsLS) return null;

  const str = localStorage.getItem(key);

  if (!str) {
    return null;
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
