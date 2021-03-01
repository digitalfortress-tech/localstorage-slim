export type Encrypter = (...args: unknown[]) => string;
export type Decrypter = (...args: unknown[]) => string;

export interface Encrypt {
  enable: false;
  encrypter: Encrypter;
  decrypter: Decrypter;
  secret: unknown;
}

export interface LocalStorageConfig {
  global_ttl?: number | null;
  global_encrypt?: Encrypt;
}
