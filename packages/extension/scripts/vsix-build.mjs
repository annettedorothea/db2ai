/**
 * Full monorepo build and vsce package → `vscode-*-X.Y.Z.vsix` in `packages/extension/`.
 *
 * Called by: repo root and `packages/extension/package.json` — `vsix:build`
 */
import { copyFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const extensionRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = path.resolve(extensionRoot, '..', '..');
const licenseDest = path.join(extensionRoot, 'LICENSE');

function run(command, args, options = {}) {
    const result = spawnSync(command, args, { stdio: 'inherit', ...options });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

run('npm', ['run', 'langium:generate', '--prefix', workspaceRoot]);
run('npm', ['run', 'build', '--prefix', workspaceRoot]);
copyFileSync(path.join(workspaceRoot, 'LICENSE'), licenseDest);
run(
    'npx',
    ['@vscode/vsce', 'package', '--allow-missing-repository', '--no-rewrite-relative-links'],
    { cwd: extensionRoot }
);
try {
    unlinkSync(licenseDest);
} catch {
    // LICENSE copy is optional cleanup
}
