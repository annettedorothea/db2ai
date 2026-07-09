#!/usr/bin/env node
/**
 * Ensures generated/{product}/mcp-build-generated-at.ts exists for tsc (gitignored stamp).
 * Real stamp is written by codegen on generate / generate:all.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(projectRoot, 'project-generate.config.json');
const config = JSON.parse(readFileSync(configPath, 'utf-8'));
const outPath = path.join(projectRoot, 'generated', config.productName, 'mcp-build-generated-at.ts');

if (!existsSync(outPath)) {
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(
        outPath,
        `/** Placeholder until generate:all — not for release verification. */\nexport const mcpBuildGeneratedAt = 'placeholder (run generate:all)';\n`,
        'utf-8'
    );
    console.log(`[ensure-mcp-build-stamp] created ${path.relative(projectRoot, outPath)}`);
}
