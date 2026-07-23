/**
 * Copy @duckdb native packages next to the language-server bundle so VSIX LSP can
 * `import('@duckdb/node-api')` (esbuild keeps DuckDB external; vsce.dependencies is false).
 *
 * Ensures **all** `@duckdb/node-bindings` optionalDependencies are installed (every OS/arch),
 * then copies them into `out/language/node_modules` for a cross-platform VSIX.
 *
 * Called by: `packages/extension/package.json` — `build` (after esbuild)
 */
//@ts-check
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

const requireFromHere = createRequire(import.meta.url);
const scriptDir = path.dirname(url.fileURLToPath(import.meta.url));
const extensionRoot = path.resolve(scriptDir, '..');
const workspaceRoot = path.resolve(extensionRoot, '..', '..');
const destNodeModules = path.join(extensionRoot, 'out', 'language', 'node_modules');

/**
 * @param {string} packageName
 * @returns {string}
 */
function resolvePackageRoot(packageName) {
    const pkgJson = requireFromHere.resolve(`${packageName}/package.json`, {
        paths: [extensionRoot, workspaceRoot, scriptDir]
    });
    return path.dirname(pkgJson);
}

/**
 * @param {string} packageName
 * @param {string} destRoot
 */
function copyPackage(packageName, destRoot) {
    const src = resolvePackageRoot(packageName);
    const dest = path.join(destRoot, ...packageName.split('/'));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.cpSync(src, dest, { recursive: true });
}

/**
 * Install any missing optional platform bindings at the workspace root (cross-platform VSIX).
 */
function ensureAllPlatformBindings() {
    const bindingsPkgJson = path.join(resolvePackageRoot('@duckdb/node-bindings'), 'package.json');
    const optional = JSON.parse(fs.readFileSync(bindingsPkgJson, 'utf-8')).optionalDependencies ?? {};
    /** @type {string[]} */
    const missing = [];
    for (const [name, version] of Object.entries(optional)) {
        try {
            requireFromHere.resolve(`${name}/package.json`, { paths: [workspaceRoot, extensionRoot] });
        } catch {
            missing.push(`${name}@${version}`);
        }
    }
    if (missing.length === 0) {
        return;
    }
    console.log(`[pack-duckdb-native] installing platform bindings: ${missing.join(', ')}`);
    // --force: allow installing foreign OS/CPU optionalDependencies on the build host
    const result = spawnSync(
        'npm',
        ['install', '--no-save', '--no-audit', '--no-fund', '--force', ...missing],
        {
            cwd: workspaceRoot,
            stdio: 'inherit'
        }
    );
    if (result.status !== 0) {
        throw new Error('[pack-duckdb-native] npm install of platform bindings failed');
    }
}

ensureAllPlatformBindings();

fs.rmSync(destNodeModules, { recursive: true, force: true });
fs.mkdirSync(destNodeModules, { recursive: true });

copyPackage('@duckdb/node-api', destNodeModules);
copyPackage('@duckdb/node-bindings', destNodeModules);
copyPackage('detect-libc', destNodeModules);

const bindingsPkgJson = path.join(resolvePackageRoot('@duckdb/node-bindings'), 'package.json');
const optionalNames = Object.keys(
    JSON.parse(fs.readFileSync(bindingsPkgJson, 'utf-8')).optionalDependencies ?? {}
).sort();
if (optionalNames.length === 0) {
    throw new Error('[pack-duckdb-native] @duckdb/node-bindings has no optionalDependencies');
}

for (const name of optionalNames) {
    copyPackage(name, destNodeModules);
}

console.log(
    `[pack-duckdb-native] wrote ${destNodeModules} (node-api, node-bindings, detect-libc, ${optionalNames.length} platforms)`
);
