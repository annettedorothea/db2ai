/**
 * Set packages/cli @core2ai/core semver to sibling core2ai/package.json version.
 * Refreshes package-lock.json sibling link (CI: npm ci needs pin === ../core2ai version).
 *
 * Usage: node scripts/sync-core2ai-pin.mjs
 * Then: npm install (or npm run sync:core2ai-pin)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const core2aiPkgPath = path.join(root, '..', 'core2ai', 'package.json');
const cliPkgPath = path.join(root, 'packages', 'cli', 'package.json');

const core2aiPkg = JSON.parse(readFileSync(core2aiPkgPath, 'utf8'));
const coreVersion = core2aiPkg.version;
if (typeof coreVersion !== 'string' || coreVersion.trim().length === 0) {
    console.error(`[sync-core2ai-pin] missing version in ${core2aiPkgPath}`);
    process.exit(1);
}

const cliPkg = JSON.parse(readFileSync(cliPkgPath, 'utf8'));
const previous = cliPkg.dependencies?.['@core2ai/core'];
if (previous === undefined) {
    console.error(`[sync-core2ai-pin] packages/cli missing dependency @core2ai/core`);
    process.exit(1);
}

cliPkg.dependencies['@core2ai/core'] = coreVersion;
writeFileSync(cliPkgPath, `${JSON.stringify(cliPkg, null, 4)}\n`, 'utf8');
console.log(`packages/cli/package.json: @core2ai/core ${previous} → ${coreVersion}`);
