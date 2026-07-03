/**
 * Sync packages/cli @toolfactory.dev/core semver pin.
 *
 * Sibling (local dev, default):
 *   node scripts/sync-core2ai-pin.mjs
 *   npm run sync:core2ai-pin   # also runs npm install → lockfile ../core2ai link
 *
 * Registry (after @toolfactory.dev/core is on npmjs):
 *   node scripts/sync-core2ai-pin.mjs --npm
 *   node scripts/sync-core2ai-pin.mjs --npm 1.0.0-rc.1
 *   npm run sync:core2ai-pin:npm
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CORE_PACKAGE = '@toolfactory.dev/core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const core2aiPkgPath = path.join(root, '..', 'core2ai', 'package.json');
const cliPkgPath = path.join(root, 'packages', 'cli', 'package.json');

const args = process.argv.slice(2);
const npmFlagIndex = args.indexOf('--npm');
const fromNpm = npmFlagIndex !== -1;
const explicitVersion =
    fromNpm && args[npmFlagIndex + 1] && !args[npmFlagIndex + 1].startsWith('-')
        ? args[npmFlagIndex + 1]
        : null;

function readSiblingVersion() {
    if (!existsSync(core2aiPkgPath)) {
        console.error(`[sync-core2ai-pin] missing ${core2aiPkgPath} (sibling core2ai checkout)`);
        process.exit(1);
    }
    const core2aiPkg = JSON.parse(readFileSync(core2aiPkgPath, 'utf8'));
    const coreVersion = core2aiPkg.version;
    if (typeof coreVersion !== 'string' || coreVersion.trim().length === 0) {
        console.error(`[sync-core2ai-pin] missing version in ${core2aiPkgPath}`);
        process.exit(1);
    }
    return coreVersion;
}

const coreVersion = explicitVersion ?? readSiblingVersion();

const cliPkg = JSON.parse(readFileSync(cliPkgPath, 'utf8'));
const previous = cliPkg.dependencies?.[CORE_PACKAGE];
if (previous === undefined) {
    console.error(`[sync-core2ai-pin] packages/cli missing dependency ${CORE_PACKAGE}`);
    process.exit(1);
}

cliPkg.dependencies[CORE_PACKAGE] = coreVersion;
writeFileSync(cliPkgPath, `${JSON.stringify(cliPkg, null, 4)}\n`, 'utf8');
console.log(`packages/cli/package.json: ${CORE_PACKAGE} ${previous} → ${coreVersion}`);

if (fromNpm) {
    console.log(`[sync-core2ai-pin] installing ${CORE_PACKAGE}@${coreVersion} from npm registry…`);
    execSync(`npm install ${CORE_PACKAGE}@${coreVersion} --workspace packages/cli`, {
        cwd: root,
        stdio: 'inherit',
        env: { ...process.env, HUSKY: '0' }
    });
    console.log('[sync-core2ai-pin] lockfile should resolve from registry.npmjs.org (no ../core2ai link)');
} else {
    console.log('[sync-core2ai-pin] refreshing ../core2ai link in package-lock.json…');
    execSync('npm install', {
        cwd: root,
        stdio: 'inherit',
        env: { ...process.env, HUSKY: '0' }
    });
}
