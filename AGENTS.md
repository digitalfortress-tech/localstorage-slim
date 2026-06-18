# AGENTS.md

Operating guide for AI agents and human contributors working in this repository.

## What this project is

`localstorage-slim` is an ultra-slim (~1 kB gzip), **zero-runtime-dependency** wrapper around the
browser `localStorage` API, adding optional **TTL (expiry)** and **pluggable encryption**. It falls
back to an in-memory store when `localStorage` is unavailable (e.g. blocked by a security policy).

The public surface is a single default-exported object: `{ config, set, get, flush, remove, clear }`.
Keep it that way — API stability and bundle size are the two hard constraints.

## Layout

| Path | Purpose |
| --- | --- |
| [src/ls.ts](src/ls.ts) | Core: `init`, `set`, `get`, `flush`, `remove`, `clear`, default obfuscator, `config`. |
| [src/helpers.ts](src/helpers.ts) | `isObject`, `memoryStore` (in-memory fallback, deprecated for v3). |
| [src/types.d.ts](src/types.d.ts) | Public types: `StorageConfig`, `Encrypter`, `Decrypter`, `Dictionary`. |
| [src/ls.spec.js](src/ls.spec.js) | Jest test suite (jsdom). The single source of behavioral truth. |
| [vite.config.ts](vite.config.ts) | Builds `es` (`.mjs`), `cjs` (`.cjs`), `umd` (`.js`) bundles + `.d.ts`. |
| [plans/](plans/) | Improvement plans (see [plans/hardening-plan.md](plans/hardening-plan.md)). |

## Toolchain (important)

- **Package manager is `pnpm` only.** Do not run `npm install` / `yarn` — there is no
  `package-lock.json`, only `pnpm-lock.yaml`.
- Build: **Vite** (`vite-plugin-dts` for declarations). Tests: **Jest + jsdom**.

## Common commands

```bash
pnpm install      # install deps
pnpm test         # jest --verbose (must stay green: 33 tests today)
pnpm run prod     # production build into dist/
pnpm run dev      # build + watch
pnpm run lint     # eslint --fix on ./src
```

`make help` lists the same via the [Makefile](Makefile).

## Conventions

- TypeScript, **strict mode** on. Single quotes, semicolons, 2-space indent, `printWidth` 120
  (Prettier + ESLint enforce this — run `pnpm lint` before committing).
- The default `encrypt` implementation is a **char-shift obfuscation, not real cryptography**.
  Never describe it as secure. For real encryption, consumers plug in CryptoJS via
  `config.encrypter`/`config.decrypter` (see README).
- TTL is stored in seconds at the API, persisted as `{ "\u0000": value, ttl: <epoch ms> }`. The
  `\u0000` sentinel (`APX`) marks library-managed TTL entries; never collide with it.
- `config` is `Object.seal`-ed — you can change existing fields but not add new ones.

## Working rules for agents

1. **Always run `pnpm test` and `pnpm run prod` before claiming a change works.** Both must pass.
2. **Do not grow the bundle** without a deliberate reason — this library's selling point is its
   size. Check the gzip number printed by `pnpm run prod`.
3. **Preserve the public API and existing test behavior.** Behavioral changes need a new/updated
   test in [src/ls.spec.js](src/ls.spec.js) and a note in the PR.
4. **Default branch for PRs is `master`;** active development happens on `develop`.
5. Touch `dist/` only via the build — it is generated and git-ignored.
6. When in doubt about an improvement, consult [plans/hardening-plan.md](plans/hardening-plan.md),
   which tracks known issues (CI drift, obfuscation clarity, `flush` edge cases, performance, etc.).

## Known sharp edges

- CI (CircleCI + CodeQL) is out of date relative to the pnpm/vite migration — see
  [plans/hardening-plan.md](plans/hardening-plan.md) §1 before touching CI.
- `flush()` runs a full storage scan on first API call; `flush(true)` force-removes anything
  shaped like a TTL wrapper. See §3–§4 of the plan.

## Contributing

See [contributing.md](contributing.md) for PR process and the issue templates under
[.github/](.github/).
