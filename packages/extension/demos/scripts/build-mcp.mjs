#!/usr/bin/env node
/**
 * Bundle one generated MCP server: npm run build:mcp -- --host passthrough-http sakila-mysql
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { HTTP_DEMOS } from './mcp-http-demos.mjs';
import { OAUTH_HTTP_DEMOS } from './mcp-oauth-demos.mjs';
import { db2aiExtraRuntimeDeps } from './extra-runtime-deps.mjs';
import { buildMcpPackage } from '../generated/db2ai/scripts/build-mcp-lib.mjs';
import { productName } from '../generated/db2ai/scripts/project-meta.mjs';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootDeps = JSON.parse(readFileSync(path.join(demosRoot, 'package.json'), 'utf-8')).dependencies ?? {};

const argv = process.argv.slice(2);
let hostKind;
/** @type {string | undefined} */
let moduleName;

for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--host' && argv[i + 1]) {
        hostKind = argv[++i];
        continue;
    }
    if (!arg.startsWith('-') && !moduleName) {
        moduleName = arg;
    }
}

if (!hostKind || !moduleName) {
    console.error('Usage: npm run build:mcp -- --host <stdio|public-http|passthrough-http|oauth-http> <module>');
    process.exit(1);
}

const { outDir, startScript } = await buildMcpPackage({
    demosRoot,
    productName,
    moduleName,
    hostKind,
    httpDemos: HTTP_DEMOS,
    oauthDemos: OAUTH_HTTP_DEMOS,
    extraRuntimeDeps: (name) => db2aiExtraRuntimeDeps(name, rootDeps, demosRoot)
});

console.log(`[build:mcp] wrote ${outDir}`);
console.log('[build:mcp] next: cd dist/mcp/' + path.basename(outDir) + ' && npm install && cp .env.example .env && npm start');
console.log('[build:mcp] start:', startScript);
