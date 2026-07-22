/**
 * Sync @toolfactory.dev/core semver pin in packages/cli and packages/extension/demos.
 *
 * Lockfiles (npm workspaces — no packages/cli/package-lock.json):
 *   - repo root package-lock.json (CLI + hoisted node_modules)
 *   - packages/extension/demos/package-lock.json (MCP runtime)
 *
 * Sibling (local dev, default):
 *   node scripts/sync-core2ai-pin.mjs
 *   npm run sync:core2ai-pin   # root + demos lockfiles → ../core2ai link
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
const rootLockPath = path.join(root, 'package-lock.json');
const core2aiPkgPath = path.join(root, '..', 'core2ai', 'package.json');
const cliPkgPath = path.join(root, 'packages', 'cli', 'package.json');
const demosPkgPath = path.join(root, 'packages', 'extension', 'demos', 'package.json');
const demosDir = path.dirname(demosPkgPath);
const demosLockPath = path.join(demosDir, 'package-lock.json');

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

function updateCorePin(pkgPath, coreVersion, label) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const previous = pkg.dependencies?.[CORE_PACKAGE];
    if (previous === undefined) {
        console.error(`[sync-core2ai-pin] ${label} missing dependency ${CORE_PACKAGE}`);
        process.exit(1);
    }
    pkg.dependencies[CORE_PACKAGE] = coreVersion;
    writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 4)}\n`, 'utf8');
    console.log(`${label}: ${CORE_PACKAGE} ${previous} → ${coreVersion}`);
}

function restoreSemverPinIfFile(pkgPath, coreVersion, label) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    if (pkg.dependencies?.[CORE_PACKAGE]?.startsWith('file:')) {
        pkg.dependencies[CORE_PACKAGE] = coreVersion;
        writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 4)}\n`, 'utf8');
        console.log(`${label}: restored ${CORE_PACKAGE} semver pin → ${coreVersion}`);
    }
}

function readInstalledCoreVersion(nodeModulesRoot) {
    const pkgPath = path.join(nodeModulesRoot, '@toolfactory.dev', 'core', 'package.json');
    if (!existsSync(pkgPath)) {
        return null;
    }
    return JSON.parse(readFileSync(pkgPath, 'utf8')).version;
}

function verifyLockfile({ lockPath, label, coreVersion, fromNpm, workspaceKey }) {
    const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
    const packages = lock.packages ?? {};
    const coreEntry = packages['node_modules/@toolfactory.dev/core'];
    const workspaceEntry = workspaceKey !== undefined ? packages[workspaceKey] : null;
    const workspacePin = workspaceEntry?.dependencies?.[CORE_PACKAGE];

    if (workspaceKey !== undefined && (!workspacePin || !String(workspacePin).includes(coreVersion))) {
        console.error(
            `[sync-core2ai-pin] ${label}: ${workspaceKey} pins ${CORE_PACKAGE}=${workspacePin ?? '(missing)'}; expected ${coreVersion}`
        );
        process.exit(1);
    }

    if (fromNpm) {
        const resolved = coreEntry?.resolved ?? '';
        const tarball = `core-${coreVersion}.tgz`;
        if (!resolved.includes(tarball)) {
            console.error(
                `[sync-core2ai-pin] ${label}: node_modules/@toolfactory.dev/core resolves to ${resolved || '(missing)'}; expected registry …/${tarball}`
            );
            process.exit(1);
        }
        if (resolved.includes('core2ai') || coreEntry?.link === true) {
            console.error(`[sync-core2ai-pin] ${label}: still linked to sibling core2ai — use --npm for release`);
            process.exit(1);
        }
    } else if (coreEntry?.link !== true && !String(coreEntry?.resolved ?? '').includes('core2ai')) {
        console.error(`[sync-core2ai-pin] ${label}: expected ../core2ai link in lockfile`);
        process.exit(1);
    }

    console.log(`[sync-core2ai-pin] verified ${label} → ${CORE_PACKAGE}@${coreVersion}`);
}

function verifyInstalls(coreVersion, fromNpm) {
    verifyLockfile({
        lockPath: rootLockPath,
        label: 'package-lock.json',
        coreVersion,
        fromNpm,
        workspaceKey: 'packages/cli'
    });
    verifyLockfile({
        lockPath: demosLockPath,
        label: 'packages/extension/demos/package-lock.json',
        coreVersion,
        fromNpm,
        workspaceKey: ''
    });

    const rootInstalled = readInstalledCoreVersion(path.join(root, 'node_modules'));
    if (rootInstalled !== coreVersion) {
        console.error(
            `[sync-core2ai-pin] root node_modules/@toolfactory.dev/core is ${rootInstalled ?? '(missing)'}; expected ${coreVersion}`
        );
        process.exit(1);
    }

    const demosInstalled = readInstalledCoreVersion(path.join(demosDir, 'node_modules'));
    if (demosInstalled !== coreVersion) {
        console.error(
            `[sync-core2ai-pin] demos node_modules/@toolfactory.dev/core is ${demosInstalled ?? '(missing)'}; expected ${coreVersion}`
        );
        process.exit(1);
    }
}

const coreVersion = explicitVersion ?? readSiblingVersion();

updateCorePin(cliPkgPath, coreVersion, 'packages/cli/package.json');
updateCorePin(demosPkgPath, coreVersion, 'packages/extension/demos/package.json');

const installEnv = { ...process.env, HUSKY: '0' };

if (fromNpm) {
    console.log(`[sync-core2ai-pin] installing ${CORE_PACKAGE}@${coreVersion} from npm registry…`);
    execSync(`npm install ${CORE_PACKAGE}@${coreVersion} --workspace packages/cli`, {
        cwd: root,
        stdio: 'inherit',
        env: installEnv
    });
    execSync('npm install', {
        cwd: root,
        stdio: 'inherit',
        env: installEnv
    });
    execSync(`npm install ${CORE_PACKAGE}@${coreVersion}`, {
        cwd: demosDir,
        stdio: 'inherit',
        env: installEnv
    });
} else {
    const core2aiDir = path.join(root, '..', 'core2ai');
    console.log('[sync-core2ai-pin] linking ../core2ai in root lockfile (semver pin kept in package.json)…');
    execSync(`npm install file:${core2aiDir} --workspace packages/cli`, {
        cwd: root,
        stdio: 'inherit',
        env: installEnv
    });
    restoreSemverPinIfFile(cliPkgPath, coreVersion, 'packages/cli/package.json');
    execSync('npm install', {
        cwd: root,
        stdio: 'inherit',
        env: installEnv
    });

    console.log('[sync-core2ai-pin] linking ../core2ai in demos lockfile…');
    execSync(`npm install file:${core2aiDir}`, {
        cwd: demosDir,
        stdio: 'inherit',
        env: installEnv
    });
    restoreSemverPinIfFile(demosPkgPath, coreVersion, 'packages/extension/demos/package.json');
    execSync('npm install', {
        cwd: demosDir,
        stdio: 'inherit',
        env: installEnv
    });
}

verifyInstalls(coreVersion, fromNpm);

console.log(
    fromNpm
        ? '[sync-core2ai-pin] done — commit packages/cli/package.json, root package-lock.json, demos package.json + package-lock.json'
        : '[sync-core2ai-pin] done — sibling link in root + demos lockfiles'
);
