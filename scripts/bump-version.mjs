/**
 * Set the same semver in all workspace package.json files (VSIX release).
 *
 * Usage: node scripts/bump-version.mjs <X.Y.Z>
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = process.argv[2];

const SEMVER =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const PACKAGE_JSON_PATHS = [
    'package.json',
    'packages/cli/package.json',
    'packages/language/package.json',
    'packages/extension/package.json',
];

if (!version || !SEMVER.test(version)) {
    console.error('Usage: node scripts/bump-version.mjs <X.Y.Z>');
    process.exit(1);
}

for (const relativePath of PACKAGE_JSON_PATHS) {
    const filePath = path.join(root, relativePath);
    const pkg = JSON.parse(readFileSync(filePath, 'utf8'));
    const previous = pkg.version;
    pkg.version = version;
    writeFileSync(filePath, `${JSON.stringify(pkg, null, 4)}\n`, 'utf8');
    console.log(`${relativePath}: ${previous} → ${version}`);
}

console.log(`Version set to ${version} in ${PACKAGE_JSON_PATHS.length} package.json file(s).`);
console.log('Running npm install to sync package-lock.json workspace versions…');
execSync('npm install', { cwd: root, stdio: 'inherit' });
