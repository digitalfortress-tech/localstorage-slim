export const NOOP = (...args: unknown[]): unknown => undefined;

export const escapeRegExp = (text: string): string => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

export const isObject = (item: any): boolean => {
  return item !== null && item.constructor.name === 'Object';
};
