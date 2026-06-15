/**
 * Release prep before `vsix:build` (guided-release CP1 verify pipeline).
 *
 * Runs from consumer workspace root via: npm run vsix:prepare
 *
 * Steps:
 *  1. langium:generate
 *  2. build (workspace + extension embed CLI)
 *  3. install:demos (demo workspace deps for tests)
 *  4. generate:all (+ format via demos package.json)
 *  5. build:generated (demos .js for local MCP; not committed)
 *  6. check (format, typecheck, lint)
 *  7. test (language + cli + demos compile check)
 *
 * Does not package the VSIX — run `npm run vsix:build` after this passes.
 * Optional: rebuild core2ai first if codegen changed (`npm run build` in sibling core2ai).
 */
import { spawnSync } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const extensionRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = path.resolve(extensionRoot, '..', '..');

function run(label, command, args) {
    console.log(`\n[vsix:prepare] ${label}\n`);
    const result = spawnSync(command, args, { stdio: 'inherit', cwd: workspaceRoot });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

run('langium:generate', 'npm', ['run', 'langium:generate']);
run('build', 'npm', ['run', 'build']);
run('install:demos', 'npm', ['run', 'install:demos']);
run('generate:all', 'npm', ['run', 'generate:all']);
run('build:generated (demos)', 'npm', ['run', 'build:generated', '--prefix', 'packages/extension/demos']);
run('check', 'npm', ['run', 'check']);
run('test', 'npm', ['run', 'test']);

console.log('\n[vsix:prepare] done — run npm run vsix:build to package the VSIX.\n');
