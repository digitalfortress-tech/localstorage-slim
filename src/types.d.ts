export type Encrypter = (...args: unknown[]) => string;
export type Decrypter = (...args: unknown[]) => string;

export type Dictionary<T = unknown> = Record<string, T>;

export interface StorageConfig {
  storage?: Storage;
  ttl?: number | null;
  encrypt?: boolean;
  decrypt?: boolean;
  encrypter?: Encrypter;
  decrypter?: Decrypter;
  secret?: unknown;
}
