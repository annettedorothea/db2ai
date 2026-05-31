#!/usr/bin/env node
/**
 * Uploads the local `.vsix` to GitHub as a prerelease (same file you tested after `vsix:build`).
 *
 * Called by: repo root and `packages/extension/package.json` — `vsix:release`
 * Requires: `gh` CLI and `packages/extension/<name>-<version>.vsix`
 */
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const extensionRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(path.join(extensionRoot, 'package.json'), 'utf8'));
const tag = `${pkg.name}-${pkg.version}`;
const vsixFile = `${tag}.vsix`;

if (!existsSync(path.join(extensionRoot, vsixFile))) {
    console.error(`[vsix:release] missing ${vsixFile} — run npm run vsix:build first`);
    process.exit(1);
}

const result = spawnSync(
    'gh',
    [
        'release',
        'create',
        tag,
        vsixFile,
        '--title',
        `${pkg.name} ${pkg.version}`,
        '--notes',
        'Internal test build of the Cursor/VS Code extension (prerelease on GitHub).',
        '--prerelease'
    ],
    { cwd: extensionRoot, stdio: 'inherit' }
);

if (result.status !== 0) {
    process.exit(result.status ?? 1);
}

console.log(`[vsix:release] done ${tag}`);
