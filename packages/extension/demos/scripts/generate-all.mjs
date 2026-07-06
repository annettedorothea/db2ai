#!/usr/bin/env node
/**
 * Generate tools for every DSL file in this workspace.
 *
 * Usage: node ./scripts/generate-all.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generateScript = path.join(projectRoot, 'scripts', 'generate.mjs');
const syncScript = path.join(projectRoot, 'scripts', 'sync-generated-scripts.mjs');
const configPath = path.join(projectRoot, 'project-generate.config.json');
const SKIP_DIRS = new Set(['node_modules', 'generated', 'tmp', 'scripts', '.git', '.cursor']);

function loadConfig() {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    if (typeof config.dslExtension !== 'string' || config.dslExtension.trim().length === 0) {
        throw new Error(`[generate-all] ${path.basename(configPath)} missing "dslExtension"`);
    }
    if (typeof config.productName !== 'string' || config.productName.trim().length === 0) {
        throw new Error(`[generate-all] ${path.basename(configPath)} missing "productName"`);
    }
    return config;
}

function findDslFiles(root, dslExtension) {
    const results = [];

    function walk(dir) {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const absolute = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (SKIP_DIRS.has(entry.name)) {
                    continue;
                }
                walk(absolute);
                continue;
            }
            if (entry.isFile() && entry.name.endsWith(dslExtension)) {
                results.push(path.relative(root, absolute));
            }
        }
    }

    walk(root);
    return results.sort();
}

function main() {
    if (!existsSync(generateScript)) {
        console.error('[generate-all] missing scripts/generate.mjs');
        process.exit(1);
    }

    const config = loadConfig();
    const dslFiles = findDslFiles(projectRoot, config.dslExtension);

    if (dslFiles.length === 0) {
        console.error(`[generate-all] no *${config.dslExtension} files found under ${projectRoot}`);
        process.exit(1);
    }

    for (const dslRelative of dslFiles) {
        const baseName = path.basename(dslRelative, config.dslExtension);
        const outRelative = path.join('generated', config.productName, 'tools', `${baseName}-tools.ts`);
        console.log(`[generate-all] ${dslRelative} → ${outRelative}`);
        execFileSync(process.execPath, [generateScript, dslRelative, outRelative], {
            stdio: 'inherit',
            cwd: projectRoot
        });
    }

    if (!existsSync(syncScript)) {
        console.error('[generate-all] missing scripts/sync-generated-scripts.mjs');
        process.exit(1);
    }
    console.log('[generate-all] syncing scripts/generated from @toolfactory.dev/core…');
    execFileSync(process.execPath, [syncScript], { stdio: 'inherit', cwd: projectRoot });
}

main();
