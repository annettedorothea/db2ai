//@ts-check
import * as esbuild from 'esbuild';
import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

const requireFromHere = createRequire(import.meta.url);

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..', '..');
const cliPkgJsonPath = path.join(workspaceRoot, 'packages', 'cli', 'package.json');
const cliVersion = JSON.parse(fs.readFileSync(cliPkgJsonPath, 'utf-8')).version;
const cliResourcesDir = path.join(workspaceRoot, 'packages', 'cli', 'resources');
const mcpSource = path.join(cliResourcesDir, 'mcp-serve-emitted.mjs');
const entry = path.join(workspaceRoot, 'packages', 'cli', 'src', 'vscode-bundle-cli-entry.ts');
const extOutDir = path.join(__dirname, 'out');

const embedRoot = path.join(extOutDir, 'embed-db2ai');
const bundlePath = path.join(embedRoot, 'cli.cjs');
const embedPkgDest = path.join(embedRoot, 'package.json');
const mcpDest = path.join(embedRoot, 'resources', 'mcp-serve-emitted.mjs');

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
    define: {
        __DB2AI_CLI_BUNDLE_VERSION__: JSON.stringify(cliVersion)
    }
    // Bundle LSP/jsonrpc deps so cli.cjs works from the terminal (npm run generate:*), not only inside the extension host.
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

const dir = path.dirname(mcpDest);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}
fs.copyFileSync(cliPkgJsonPath, embedPkgDest);
if (!fs.existsSync(mcpSource)) {
    throw new Error(
        `Bundled MCP host missing (${mcpSource}). Run "npm run bundle:mcp-runtime" from the db2ai workspace root before building the extension.`
    );
}
fs.copyFileSync(mcpSource, mcpDest);
console.log(`[embed-cli] wrote ${bundlePath} and embed resources`);
