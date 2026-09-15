# Shared Types Package — Setup Guide & Gotchas

Documents how the `@carecoin/shared-types` workspace package was set up, the issues hit along the way, and the final approach that actually worked. Kept as a reference for future workspace packages, not just this one.

**Environment**: Yarn Classic 1.22.22, Vite (client), Express (server planned).

---

## Final working setup

Uses TypeScript project references. `shared-types` has its own `tsconfig.json`, and is resolved as a normal workspace dependency via `node_modules` symlink + its own `package.json`.

### 1. Folder structure

```
care-coin/
├── package.json (root)
├── client/
│   └── tsconfig.json
├── server/
│   └── tsconfig.json
└── packages/
    └── shared-types/
        ├── package.json
        ├── tsconfig.json
        └── src/
            └── index.ts
```

### 2. Root `package.json`

```json
{
  "name": "@carecoin/root",
  "private": true,
  "workspaces": ["client", "server", "packages/*"]
}
```

### 3. `packages/shared-types/package.json`

```json
{
  "name": "@carecoin/shared-types",
  "version": "1.0.0",
  "main": "src/index.ts",
  "private": true
}
```

`main` points directly at the `.ts` source — no `dist`, no `build` script.

### 4. `packages/shared-types/tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "strict": true,
    "jsx": "react-jsx",
    "declaration": true,
    "skipLibCheck": true
  }
}
```

A `tsconfig.json` in `shared-types` is required for project references to resolve it as a distinct TS project.

### 5. Client/server dependency

```json
// client/package.json and server/package.json
"dependencies": {
  "@carecoin/shared-types": "*"
}
```

`"*"` — any local workspace version satisfies it, no need to bump this when `shared-types`' own version changes.

### 6. Client/server `tsconfig.json` — project reference

```jsonc
{
  "references": [
    { "path": "../packages/shared-types" }
  ]
}
```

### 7. Install from root only

```bash
yarn install
```

### 8. Usage

```ts
import type { Medicine } from '@carecoin/shared-types';
```

---

## Issues faced, in order

### 1. `workspace:*` protocol not supported

**Error**: `Couldn't find package "@carecoin/shared-types@workspace:*" ... on the "npm" registry.`

**Cause**: `workspace:*` is a Yarn Berry (v2+) / npm / pnpm protocol. Yarn Classic (1.x) doesn't understand it and tries to resolve it literally against the npm registry.

**Fix**: Use a plain version string instead — `"1.0.0"` (matching the package's own version) or `"*"`. Yarn Classic links local workspace packages by name + satisfying version range, not a special protocol keyword.

### 2. Root package name: bare scope is invalid

**Error**: `package.json: Name contains illegal characters` when root `"name"` was set to `"@carecoin"`.

**Cause**: An npm scope (`@something`) must always be paired with a package name after a slash (`@scope/name`). A bare `@scope` alone is invalid.

**Fix**: A scope always needs a name after the slash — used `"@carecoin/root"` instead, keeping the scope consistent with the other workspace packages (`@carecoin/shared-types`, `@carecoin/client`, `@carecoin/server`) rather than dropping the scope for root alone.

### 3. Cross-project `rootDir` error when using TS project references

**Error**: `File '.../packages/shared-types/src/index.ts' is not under 'rootDir' '.../server/src'.`

**Cause**: `shared-types` had no `tsconfig.json`, and a `paths` alias pointed directly into `shared-types/src`. TypeScript treated that source file as part of `server`'s own compilation unit, which fails `rootDir` checks since the file lives outside `server/src`.

**Fix**: Added a `tsconfig.json` to `packages/shared-types` and removed the `paths` alias, relying on `references` plus normal package resolution instead.

### 4. VS Code auto-import suggesting the wrong path

**Symptom**: Auto-import suggested a relative/absolute path into `packages/shared-types/src/...` instead of the clean `@carecoin/shared-types` package name.

**Cause**: A leftover `paths` alias was competing with the `references` entry, and `shared-types` had no `tsconfig.json` of its own yet.

**Fix**: Removed the `paths` alias, added `tsconfig.json` to `shared-types`. With one clear resolution path, auto-import correctly suggests the package name.

### 5. Caching pain when editing shared package during development

**Symptom**: Changes to `shared-types` not reflected in `client`/`server` without a full `node_modules` wipe and reinstall.

**Cause**: `composite`/`references` generate a `.tsbuildinfo` incremental build cache. When this cache goes stale relative to actual source changes, edits to `shared-types` can appear not to take effect in `client`/`server` until the cache is cleared.

**Resolution**: Added a `clean:cache` script (see scripts below) to clear stale `.tsbuildinfo` files as a lightweight first fix — cheaper than a full `node_modules` wipe, and usually sufficient.

### 6. Installing per-workspace instead of from root

**Symptom**: Manually running `yarn install` inside `client/`, `server/`, and `packages/shared-types/` individually, then again at root, believing all steps were necessary for changes to be picked up.

**Cause**: Misunderstanding of how Yarn workspaces are meant to be used — installing per-folder fragments the dependency tree and symlinking, rather than letting Yarn resolve everything together.

**Fix**: `yarn install`, from the **repo root only**, handles every workspace in one pass — installs all dependencies, hoists shared deps, and symlinks internal workspace packages (like `@carecoin/shared-types`) automatically. Per-folder installs are unnecessary and can actively cause the linking issues above.

### 7. `rimraf` glob pattern failing on Windows

**Error**: `Illegal characters in path` when running `rimraf **/tsconfig.tsbuildinfo`.

**Cause**: Glob patterns like `**/*` are normally expanded by the shell (bash/zsh) before being passed to a command. Windows shells (PowerShell/cmd) don't do this expansion — `rimraf` received the literal, unexpanded string and failed.

**Fix**: Use `rimraf`'s own glob-handling flag so it expands the pattern itself, independent of the shell:

```json
"clean:cache": "rimraf -g **/tsconfig.tsbuildinfo"
```

Makes the script work identically on Windows, macOS, and Linux.

---

## Root `package.json` scripts (developer convenience)

```json
"scripts": {
  "dev": "concurrently -n client,server -c cyan,green \"yarn workspace @carecoin/client dev\" \"yarn workspace @carecoin/server dev\"",
  "clean": "rimraf -g node_modules client/node_modules server/node_modules packages/*/node_modules yarn.lock",
  "clean:cache": "rimraf -g **/tsconfig.tsbuildinfo",
  "reset": "yarn clean && yarn install",
  "build": "yarn workspace @carecoin/client build && yarn workspace @carecoin/server build"
}
```

Requires `concurrently` and `rimraf` as root dev dependencies:
```bash
yarn add -W -D concurrently rimraf
```

| Script | When to use |
|---|---|
| `yarn dev` | Everyday — starts client + server together in one terminal |
| `yarn clean:cache` | First thing to try if changes seem "stuck" — cheap, non-destructive |
| `yarn reset` | Last resort — full wipe and reinstall, rarely needed |

---

## Key lessons

1. **A types-only package still needs its own `tsconfig.json`** for TS project references to treat it as a distinct project — skipping this was the root cause of the `rootDir` cross-project error. Don't assume a package is "too simple" to need one.
2. **Don't mix `paths` aliases with `references` for the same package.** Pick one resolution strategy — `references` (+ normal package resolution) worked once the competing `paths` override was removed.
3. **Yarn Classic ≠ Yarn Berry.** Protocols like `workspace:*` and concepts like PnP don't apply to Classic — always confirm `yarn --version` before following setup instructions that assume Berry.
4. **Always install from the workspace root**, never per-folder. This is the single most common source of "why isn't my change showing up" confusion in a Yarn workspaces setup.
5. **Scoped package names need a name after the slash** — `@scope` alone is invalid; only `@scope/package-name` is.
