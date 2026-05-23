//@ts-check
import * as esbuild from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..', '..');
const cliPkgJsonPath = path.join(workspaceRoot, 'packages', 'cli', 'package.json');
const cliVersion = JSON.parse(fs.readFileSync(cliPkgJsonPath, 'utf-8')).version;
const cliResourcesDir = path.join(workspaceRoot, 'packages', 'cli', 'resources');
const mcpSource = path.join(cliResourcesDir, 'mcp-serve-emitted.mjs');
const entry = path.join(workspaceRoot, 'packages', 'cli', 'src', 'vscode-bundle-cli-entry.ts');
const extOutDir = path.join(__dirname, 'out');

const bundlePath = path.join(extOutDir, 'embed-db2ai', 'cli.cjs');
const embedPkgDest = path.join(extOutDir, 'embed-db2ai', 'package.json');
const mcpDest = path.join(extOutDir, 'embed-db2ai', 'resources', 'mcp-serve-emitted.mjs');

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
        'empty-import-meta': 'silent',
    },
    define: {
        __DB2AI_CLI_BUNDLE_VERSION__: JSON.stringify(cliVersion)
    },
    // Bundle LSP/jsonrpc deps so cli.cjs works from the terminal (npm run generate:*), not only inside the extension host.
});

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
