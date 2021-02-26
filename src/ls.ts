/*
 * https://github.com/niketpathak/localstorage-slim
 * Copyright (c) 2021 Niket Pathak
 * MIT License
 */

import { isObject } from './helpers';

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

const set = (key: string, value: unknown, ttl?: number): void | boolean => {
  if (!supportsLS) return false;

  try {
    const val = ttl ? JSON.stringify({ value, ttl: Date.now() + +ttl }) : JSON.stringify(value);
    localStorage.setItem(key, val);
  } catch (e) {
    // Sometimes stringify fails due to circular refs
    return false;
  }
};

const get = (key: string): null | unknown => {
  if (!supportsLS) return null;

  const itemStr = localStorage.getItem(key);

  if (!itemStr) {
    return null;
  }

  const item = JSON.parse(itemStr);

  if (isObject(item) && item.ttl && Date.now() > item.ttl) {
    localStorage.removeItem(key);
    return null;
  }
  return isObject(item) && 'value' in item ? item.value : item;
};

const flush = () => {
  if (!supportsLS) return false;
  // @todo: implement flush
};

export const ls = {
  set,
  get,
  flush,
};
