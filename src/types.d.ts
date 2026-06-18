export type Encrypter = (...args: unknown[]) => string;
export type Decrypter = (...args: unknown[]) => unknown;

export type Dictionary<T = unknown> = Record<string, T>;

export interface StorageConfig {
  storage?: Storage;
  ttl?: number | null;
  /**
   * Enable encryption of stored values. NOTE: the default implementation is a char-shift
   * OBFUSCATION, not cryptographically secure encryption. Override `encrypter`/`decrypter` with a
   * real algorithm (e.g. AES via CryptoJS) for genuine confidentiality.
   */
  encrypt?: boolean;
  decrypt?: boolean;
  /** Encryption function. The built-in default only obfuscates — supply your own for real crypto. */
  encrypter?: Encrypter;
  /** Decryption function paired with `encrypter`. */
  decrypter?: Decrypter;
  secret?: unknown;
}
