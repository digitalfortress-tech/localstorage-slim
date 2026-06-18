# Security Policy

## Threat model

`localstorage-slim` is a thin wrapper around the browser `localStorage`/`sessionStorage` APIs.
Please keep the following in mind:

- **`localStorage` is readable and writable by any JavaScript running on the same origin.** It is
  not a secure store. Anyone with script access (including via XSS) can read everything in it.
- **The built-in `encrypt` option is obfuscation, not encryption.** The default `encrypter` /
  `decrypter` perform a reversible character shift to deter casual inspection only. It provides
  **no cryptographic confidentiality**. For genuine encryption, override `config.encrypter` /
  `config.decrypter` with a real algorithm such as AES via
  [CryptoJS](https://www.npmjs.com/package/crypto-js) (see the README "Encryption" section).
- **Do not store secrets in localStorage** — passwords, API tokens, session tokens, credit-card
  numbers, or other PII — whether obfuscated/encrypted or not.

## Supported versions

Security fixes are applied to the latest published `2.x` release.

## Reporting a vulnerability

Please report suspected vulnerabilities **privately** rather than opening a public issue:

- Use GitHub's "Report a vulnerability" (Security Advisories) for this repository, or
- Email the maintainer (see the `author` field in [package.json](package.json)).

Please include reproduction steps and the affected version. We aim to acknowledge reports promptly
and will coordinate a fix and disclosure timeline with you.
