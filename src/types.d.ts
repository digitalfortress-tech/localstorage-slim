export type Encrypter = (...args: unknown[]) => string;
export type Decrypter = (...args: unknown[]) => string;

export interface LocalStorageConfig {
  global_ttl?: number | null;
  encrypt?: boolean;
  encrypter: Encrypter;
  decrypter: Decrypter;
}
