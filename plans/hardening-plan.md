# localstorage-slim — Hardening, Performance & Code-Review Plan

> Status: proposed · Author: code review pass · Date: 2026-06-18
> Scope: `src/` library code, build/test tooling, CI, docs. The library is a ~1 kB
> zero-dependency localStorage wrapper with optional TTL and pluggable encryption.

This plan is organized by theme. Each item has a **severity** (🔴 high / 🟡 medium / 🟢 low),
the **rationale**, and a **concrete action**. Items are intentionally small and independently
shippable so they can be picked off without a large refactor. The library's public API and
~1 kB footprint are treated as hard constraints — nothing here should grow the bundle materially
or break the existing 33 tests.

---

## 0. Baseline (verified on 2026-06-18)

- `pnpm test` → **33/33 passing** (jest + jsdom, ts-jest + babel-jest).
- `pnpm prod` → builds `es`/`cjs`/`umd` bundles via Vite (~0.9 kB gzip) + d.ts via `vite-plugin-dts`.
- Source is 3 files: [src/ls.ts](../src/ls.ts), [src/helpers.ts](../src/helpers.ts), [src/types.d.ts](../src/types.d.ts).

Everything below is incremental on top of a green baseline.

---

## 1. CI / Infrastructure (🔴 highest leverage — currently broken)

The repo migrated npm→pnpm and webpack→vite (see recent commits) but CI was **not** updated.

1.1. ✅ **DONE** — 🔴 **CircleCI installs with npm but the project is pnpm-only.**
   Resolved by retiring CircleCI entirely (`.circleci/config.yml` removed) in favor of the
   GitHub Actions workflow added in 1.4. The npm/pnpm mismatch and EOL Node 16 image no longer exist.

1.2. ✅ **DONE** — 🔴 **CodeQL workflow uses retired action versions.**
   [.github/workflows/codeql-analysis.yml](../.github/workflows/codeql-analysis.yml) upgraded to
   `actions/checkout@v4` and `github/codeql-action/*@v3`, and `develop` added to the trigger branches.

1.3. ✅ **DONE** — 🟡 **No CI test run on PRs to `develop`.** The new
   [ci.yml](../.github/workflows/ci.yml) runs lint + test + build on push and PRs to both `master`
   and `develop`.

1.4. ✅ **DONE** — 🟡 **Consolidate CI.** Added a single
   [.github/workflows/ci.yml](../.github/workflows/ci.yml) (pnpm via `pnpm/action-setup`, Node 20/22
   matrix, `setup-node` pnpm cache) running `pnpm run lint`, `pnpm run test`, `pnpm run prod`.
   CircleCI retired; the README build badge now points at GitHub Actions.

1.5. 🟢 **Add `engines` + `.nvmrc`/`packageManager`.** Declare `"engines": { "node": ">=20" }` and
   `"packageManager": "pnpm@<version>"` in [package.json](../package.json) so contributors and CI
   use a consistent toolchain (corepack-friendly).

1.6. 🟢 **Dependabot / renovate.** Add `.github/dependabot.yml` for `npm` + `github-actions`
   ecosystems to keep deps and pinned actions current.

---

## 2. Security & Hardening

2.1. ✅ **DONE** — 🟡 **Make the "encryption is obfuscation" warning impossible to miss.**
   Added a prominent JSDoc block above the default `shift`/`encrypter`/`decrypter` in
   [src/ls.ts](../src/ls.ts) stating it is obfuscation, not cryptography, and pointing to the
   CryptoJS recipe; added matching JSDoc on `encrypt`/`encrypter`/`decrypter` in the public
   [src/types.d.ts](../src/types.d.ts) (so the warning surfaces in consumers' editors). No behavior
   change.

2.2. ✅ **DONE** — 🟢 **Add `SECURITY.md`** — added [SECURITY.md](../SECURITY.md) with the threat
   model (same-origin script access, obfuscation ≠ encryption, don't store secrets), supported
   versions, and private disclosure instructions.

2.3. 🟢 **Publish provenance / supply chain.** When publishing, use `pnpm publish --provenance`
   from CI (npm provenance) and ensure `files` whitelist (already `["dist/"]`) excludes maps if
   they are not wanted in the tarball. Confirm `.npmignore` vs `files` behavior for `*.map`.

2.4. 🟢 **Tighten `secret` typing.** `secret?: unknown` in [src/types.d.ts](../src/types.d.ts) is
   loose; the default implementation requires a `number`. Consider `string | number` for the public
   type while keeping custom encrypters free (they already receive `unknown`). Low risk, improves DX.

---

## 3. Correctness & Safe Fixes

3.1. ✅ **DONE** — 🟡 **`flush(force=true)` can delete unrelated user objects.**
   `flush()` removes any stored object where `isObject(item) && APX in item` and
   `(now > item.ttl || force)` ([src/ls.ts:133](../src/ls.ts#L133)). A value the user legitimately
   stored that happens to contain a `"\u0000"` key would be force-deleted. The APX sentinel is a
   reasonable heuristic, but a TTL wrapper is specifically `{ [APX]: value, ttl: <number> }`.
   **Resolution:** detection now goes through `isTTLWrapper()` (see 5.1), which requires
   `typeof item.ttl === 'number'`, so only genuine TTL wrappers are flushed and `get()` round-trips
   a user object that merely contains the sentinel key. Covered by a new regression test in
   [src/ls.spec.js](../src/ls.spec.js) ("flush(true) should not remove user objects that merely
   contain the sentinel key").

3.2. 🟡 **Document/guard the char-shift cipher's lossy range.** `shift()` does
   `String.fromCharCode(charCodeAt(i) + offset)`. Large offsets or values near the UTF-16 boundary
   can produce lone surrogates that survive `setItem` but make `JSON.parse` on read fall into the
   silent catch, returning the raw obfuscated string instead of the original. **Action:** document
   the safe `secret` range for the default cipher, and add a test asserting round-trip for a
   reasonable secret range. (Full fix = recommend CryptoJS; do not expand the default cipher.)

3.3. 🟢 **`get()` swallows all decrypt/parse errors silently.** The catch in
   [src/ls.ts:102-105](../src/ls.ts#L102-L105) is intentional (wrong secret → return raw), but it
   also masks genuine bugs in a custom `decrypter`. **Action:** keep the behavior, but consider an
   opt-in `config.onError?(err)` hook (no-op by default, zero bundle cost when unused) so consumers
   can observe failures. Optional / v3.

3.4. 🟢 **`init()` swallow on storage probe.** `storage.getItem('')` probe is fine; ensure the
   memory-store fallback is covered by a test (simulate `localStorage` throwing). Currently the
   fallback path in [src/helpers.ts](../src/helpers.ts) has no direct test.

---

## 4. Performance

4.1. 🟡 **`flush()` runs a full O(n) scan on the first API call of every session.**
   `init()` → `flush()` iterates every key in storage and `JSON.parse`s each one
   ([src/ls.ts:120-137](../src/ls.ts#L120-L137)). For apps with large/shared localStorage this adds
   latency to the first `get`/`set`. **Action:** make the auto-flush-on-init opt-out via a config
   flag (default keep current behavior for compatibility), or defer it to `requestIdleCallback`
   when available. Document the tradeoff.

4.2. 🟢 **Double storage read in `flush()`.** `Object.keys(storage)` then `storage.getItem(key)`
   reads each key twice. Minor; iterating `Object.entries` isn't available on `Storage`, so this is
   acceptable — note it and leave as-is unless profiling shows it matters.

4.3. 🟢 **Avoid re-`JSON.stringify` of the secret-shift for TTL wrappers.** Current code is already
   minimal; no action beyond keeping the bundle small. Verify gzip size stays ≤ ~0.95 kB after any
   change (CI bundle-size assertion would be nice — see 6.3).

---

## 5. Redundancy & Code Quality

5.1. ✅ **DONE** — 🟡 **Extract the duplicated TTL-wrapper detection.** Added
   `isTTLWrapper(item): boolean` to [src/helpers.ts](../src/helpers.ts) (along with the `APX`
   sentinel, moved there from `ls.ts`) and reused it in both `get()` and `flush()`. This removed the
   duplicated `isObject(item) && APX in item` checks and folded in the ttl-number guard from 3.1.

5.2. 🟢 **Centralize the local-vs-global config resolution.** `encrypt`, `ttl`, `secret`,
   `encrypter`/`decrypter` are each resolved with the same `localConfig.x ?? config.x` dance in both
   `set()` and `get()`. A tiny `resolve(localConfig)` helper would cut repetition. Keep an eye on
   bundle size; only do this if it doesn't add bytes.

5.3. 🟢 **De-duplicate test setup.** Each `describe` block repeats the same
   `clear()` + reset-config in `beforeEach`/`afterEach` ([src/ls.spec.js](../src/ls.spec.js)). Hoist
   to a top-level `beforeEach` (or a shared helper) to shrink the spec and prevent reset drift.

5.4. 🟢 **Remove the dead `node` types from a browser library.** `tsconfig.json` has
   `"types": ["node"]` ([tsconfig.json](../tsconfig.json)) but the library targets the browser and
   uses no Node APIs. Dropping it (or scoping node types to the test config) keeps the public
   `.d.ts` clean and avoids leaking `@types/node` expectations onto consumers.

---

## 6. Tooling, Tests & DX

6.1. 🟡 **Add coverage reporting + a floor.** `jest --coverage` with a modest threshold (e.g. 90%
   lines, given the small surface) in [package.json](../package.json). Wire into CI. Add the
   currently-untested memory-store fallback (3.4) to push coverage up.

6.2. 🟢 **Single test transformer.** Jest configures both `babel-jest` and `ts-jest`. The spec is
   `.js` and source is `.ts`; confirm both are actually needed or collapse to one transformer to
   speed up the suite and simplify config.

6.3. 🟢 **Bundle-size guard.** Add a `size-limit` (or a simple gzip-size assertion script) check in
   CI so the "~1 kB" promise in the README/badges can't silently regress.

6.4. ✅ **DONE** — 🟢 **Fix README copy-paste error.** The install comment now reads
   "you can install localstorage-slim with npm" ([README.md](../README.md)), and the hard-pinned
   `unpkg.com/localstorage-slim@2.7.0` example is now the versionless
   `unpkg.com/localstorage-slim/...` URL so it tracks the latest release.

6.5. 🟢 **Documentation set.** Add `AGENTS.md` (contributor + agent operating guide) and a
   `CLAUDE.md` that points to it (delivered alongside this plan). Keep them in sync with
   `contributing.md`.

---

## 7. Suggested sequencing

1. **CI first** (§1.1–1.4) — without green CI nothing else is verifiable. Quick, high value.
2. **Safe correctness fixes** (§3.1, §5.1) — small, test-backed, ship together.
3. **Docs/security clarity** (§2.1, §2.2, §6.4) — no code risk.
4. **Performance opt-out + coverage** (§4.1, §6.1) — slightly larger, do behind tests.
5. **Polish** (§5.2–5.4, §2.4, §6.2–6.3) — opportunistic.

Each numbered item is independently revertible. None require a major version bump except the
optional v3 ideas explicitly marked (§3.3, and the already-planned `memoryStore` removal noted in
[src/helpers.ts](../src/helpers.ts)).
