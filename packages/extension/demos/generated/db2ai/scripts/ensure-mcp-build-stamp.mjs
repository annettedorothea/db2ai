// @generated from @toolfactory.dev/core — do not edit; regenerated when running project generate.

/**
 * Ensures generated/db2ai/mcp-build-generated-at.ts exists for tsc.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { productName } from './project-meta.mjs';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDir, '../../..');
const outPath = path.join(projectRoot, 'generated', productName, 'mcp-build-generated-at.ts');

if (!existsSync(outPath)) {
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(
        outPath,
        `/** Placeholder until generate:all — not for release verification. */\nexport const mcpBuildGeneratedAt = 'placeholder (run generate:all)';\n`,
        'utf-8'
    );
    console.log(`[ensure-mcp-build-stamp] created ${path.relative(projectRoot, outPath)}`);
}
