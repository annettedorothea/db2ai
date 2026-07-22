/**
 * Esbuild-bundles the CLI into `out/embed-db2ai/cli.cjs` for demo `generate:*` scripts and VSIX embed.
 *
 * Called by: `packages/extension/package.json` — `build`
 * Entry: `packages/cli/src/vscode-bundle-cli-entry.ts`
 */
//@ts-check
import * as esbuild from 'esbuild';
import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

const requireFromHere = createRequire(import.meta.url);

const scriptDir = path.dirname(url.fileURLToPath(import.meta.url));
const extensionRoot = path.resolve(scriptDir, '..');
const workspaceRoot = path.resolve(extensionRoot, '..', '..');
const cliPkgJsonPath = path.join(workspaceRoot, 'packages', 'cli', 'package.json');
const cliVersion = JSON.parse(fs.readFileSync(cliPkgJsonPath, 'utf-8')).version;
const entry = path.join(workspaceRoot, 'packages', 'cli', 'src', 'vscode-bundle-cli-entry.ts');
const extOutDir = path.join(extensionRoot, 'out');

const embedRoot = path.join(extOutDir, 'embed-db2ai');
const bundlePath = path.join(embedRoot, 'cli.cjs');
const embedPkgDest = path.join(embedRoot, 'package.json');
await esbuild.build({
    entryPoints: [entry],
    outfile: bundlePath,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: ['node20'],
    banner: {
        js: '#!/usr/bin/env node'
    },
    sourcemap: false,
    logLevel: 'warning',
    logOverride: {
        'empty-import-meta': 'silent'
    },
    external: ['esbuild'],
    plugins: [
        {
            name: 'external-duckdb-native',
            setup(build) {
                build.onResolve({ filter: /^@duckdb\// }, (args) => ({
                    path: args.path,
                    external: true
                }));
            }
        }
    ],
    define: {
        __DB2AI_CLI_BUNDLE_VERSION__: JSON.stringify(cliVersion)
    }
});

function copyEsbuildForEmbedCli() {
    const esbuildPkgDir = path.dirname(requireFromHere.resolve('esbuild/package.json'));
    const embedNodeModules = path.join(embedRoot, 'node_modules');
    const embedEsbuildDest = path.join(embedNodeModules, 'esbuild');
    fs.mkdirSync(embedNodeModules, { recursive: true });
    fs.cpSync(esbuildPkgDir, embedEsbuildDest, { recursive: true });

    const workspaceEsbuildScope = path.join(workspaceRoot, 'node_modules', '@esbuild');
    if (fs.existsSync(workspaceEsbuildScope)) {
        const embedScope = path.join(embedNodeModules, '@esbuild');
        fs.mkdirSync(embedScope, { recursive: true });
        for (const platformPkg of fs.readdirSync(workspaceEsbuildScope)) {
            fs.cpSync(path.join(workspaceEsbuildScope, platformPkg), path.join(embedScope, platformPkg), {
                recursive: true
            });
        }
    }
}

copyEsbuildForEmbedCli();

fs.copyFileSync(cliPkgJsonPath, embedPkgDest);
console.log(`[embed-cli] wrote ${bundlePath}`);
