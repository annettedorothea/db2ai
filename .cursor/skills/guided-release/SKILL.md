---
name: guided-release
description: >-
    Guided VSIX release for api2ai and db2ai (optional core2ai tag). One checkpoint per
    turn: verify, version bump, commit, VSIX build, manual test, GitHub release. Use for
    guided release, release, release CPn, or release weiter. Never git commit/push/tag/gh
    unless the user explicitly asks. For commits: repo + message only (user checks in via IDE).
---

# Guided release

**Ein Flow**, unterbrechbar. Der Agent führt **höchstens einen Checkpoint** pro Antwort aus und **stoppt** danach.

**Invoke:** `guided release`, `release`, `release CP0`, `release weiter`, `release ab CP4`.

**Repos:** `core2ai`, `../api2ai`, `../db2ai` (sibling layout). VSIX-Releases laufen **pro Consumer** (api2ai oder db2ai); beide nacheinander, wenn der User beide will.

## Hard rules

1. **No automatic git** — never `git commit`, `git push`, `git tag`, or `gh release` unless the user explicitly asks.
2. **User commits in the IDE** — at commit CPs, output only **repo** + **commit message** (+ optional one-line note). No `git add` lists.
3. **One checkpoint per turn** — status table with `[x]` / `[ ]`; wait for `release weiter` or manual test OK.
4. **Agent may run** `npm run …` — not git.
5. **Version before VSIX** — bump and **push** consumer version **before** `vsix:build` (VSIX filename = committed version).
6. **`.vsix` is local** — not committed; GitHub upload only via `vsix:release` after manual preview.

## Checkpoint map

| CP    | Name                              | Who   |
| ----- | --------------------------------- | ----- |
| **0** | Clean git (three repos)           | Agent |
| **1** | Verify pipeline                   | Agent |
| **2** | Version bump + regenerate         | Agent |
| **3** | Commit + push                     | User  |
| **4** | VSIX build                        | Agent |
| **5** | Manual preview                    | User  |
| **6** | GitHub release (`vsix:release`)   | User  |

Optional **core2ai library tag** (only if `src/codegen/**` changed since last tag): before **CP1**, bump `core2ai/package.json`, `npm run build && npm run check`, user commit + tag on **core2ai** — no consumer pin step (dev uses **npm link**).

---

## CP0 — Clean git

Agent: `git status` in **core2ai**, **api2ai**, **db2ai**.

- **Stop** if dirty before release work — **repo + commit message** per repo (IDE).
- **Exception:** after **CP2** until **CP3** push, the releasing consumer may stay dirty — expected.

→ **CP1**

---

## CP1 — Verify pipeline

Agent runs in the **releasing consumer** (api2ai or db2ai):

1. If **core2ai** `src/` changed: `npm run build && npm run check` in **core2ai** (or confirm `npm run watch` was running).
2. From consumer root: **`npm run vsix:prepare`** — runs `langium:generate`, `build`, `install:demos`, `generate:all`, `build:generated` (demos), `check`, and workspace tests (language, cli, demos). Does **not** package a VSIX.

Manual equivalent (same order as `packages/extension/scripts/vsix-prepare.mjs`):

```bash
npm run langium:generate && npm run build
npm run install:demos
npm run generate:all
npm run build:generated --prefix packages/extension/demos
npm run check
npm run test --workspace packages/language
npm run test --workspace packages/cli
npm run test --prefix packages/extension/demos
```

**Not enough before `vsix:build`:** `npm run build --workspace packages/extension` alone — missing regenerate, demos JS, check, and tests.

**End CP1:** stop if red; else → **CP2**.

---

## CP2 — Version bump + regenerate

Ask target **VSIX version** (`X.Y.Z`) — do not guess.

From the **releasing consumer** root (or **core2ai** for library tag):

```bash
npm run vsix:version -- X.Y.Z
```

(api2ai / db2ai — updates root + `packages/cli`, `packages/language`, `packages/extension` `package.json`.)

Optional **core2ai** prelude:

```bash
cd ../core2ai && npm run version -- X.Y.Z
```

Do **not** use `npm version` or ad-hoc single-file edits — easy to misalign VSIX filename vs package versions.

After the command, confirm all four consumer `package.json` files show the same `X.Y.Z`.

Then:

```bash
npm run generate:all
cd packages/extension/demos && npm run build:generated
npm run check && npm test
```

**End CP2:** stop → **CP3**.

---

## CP3 — Commit + push (user)

**One commit** in the releasing consumer — version bump + regenerated demos together, then **push**.

| Repo     | Message (example)              |
| -------- | ------------------------------ |
| `api2ai` | `Release v0.0.5: <one line why>` |
| `db2ai`  | `Release v0.0.5: <one line why>` |

If **core2ai** was tagged in the optional prelude, that is a **separate** commit on **core2ai**.

**End CP3:** consumer clean and pushed → **CP4**.

---

## CP4 — VSIX build

From consumer root:

```bash
npm run vsix:build
```

Output (local, not committed): `packages/extension/vscode-api2ai-X.Y.Z.vsix` or `vscode-db2ai-X.Y.Z.vsix`.

**End CP4:** stop → **CP5**.

---

## CP5 — Manual preview (user)

1. Install the **`.vsix`** from CP4; reload window.
2. Extension Dev Host → demos: generate/save, MCP tools smoke.
3. **db2ai:** Docker demos if relevant.
4. Optional: `npm test` (consumer root) — includes MCP stdio integration tests.

**End CP5:** stop until OK → **CP6** or done.

---

## CP6 — GitHub release (user, optional)

Only after **CP5** OK — publish the **same VSIX** you tested.

From consumer root:

```bash
npm run vsix:release
```

Runs `gh release create` (prerelease) for `vscode-*-X.Y.Z.vsix`. No rebuild.

Repeat **CP0–CP6** for the other consumer if both extensions ship.

---

## Resume

| User says        | Agent does        |
| ---------------- | ----------------- |
| `guided release` | CP0 → CP1         |
| `release CP4`    | CP4 VSIX only     |
| `release CP2`    | CP2 bump only     |
| `release weiter` | Next open CP      |

---

## Troubleshooting

| Problem                         | Action                                                                 |
| ------------------------------- | ---------------------------------------------------------------------- |
| VSIX wrong version in filename  | Bump in **CP2**, commit in **CP3**, then **CP4** again                  |
| `vsix:release` missing file     | Run **CP4** (`vsix:build`) first                                       |
| MCP broken after core2ai change | Rebuild core2ai (`watch`/`build`), regenerate demos, restart MCP       |
| Check fails on generated output | Fix generator or DSL — never hand-edit `generated/**` (see rules)      |

## Reference

- Build/link: [`../../../core2ai/.cursor/rules/core2ai-build.mdc`](../../../core2ai/.cursor/rules/core2ai-build.mdc)
- VSIX scripts: repo root `vsix:prepare`, `vsix:build`, `vsix:release` → `packages/extension/scripts/vsix-prepare.mjs`, `vsix-build.mjs`, `vsix-release.mjs`
