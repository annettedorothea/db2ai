#!/usr/bin/env node
/**
 * Stop OAuth IdP (Docker DBs are left running; use npm run db:down separately).
 */
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadProjectEnvLocal } from './generated/load-env-local.mjs';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

loadProjectEnvLocal();
console.log('[kill-fixtures] stopping OAuth IDP…');
const result = spawnSync(process.execPath, [path.join(demosRoot, 'oauth-idp', 'kill-server.mjs')], {
    cwd: demosRoot,
    stdio: 'inherit'
});
if (result.status !== 0) {
    process.exit(result.status ?? 1);
}
console.log('[kill-fixtures] done.');
