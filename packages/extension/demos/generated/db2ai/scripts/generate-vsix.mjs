// @generated from @toolfactory.dev/core — do not edit; regenerated when running project generate.

/**
 * VSIX generate for one .db2ai file (extension CLI only).
 * Usage: node ./generated/db2ai/scripts/generate-vsix.mjs <file.db2ai> [out.ts]
 */
import { execFileSync } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { dslExtension, embedHomeEnvVar, productName } from './project-meta.mjs';
import { resolveCliVsix } from './resolve-cli-vsix.mjs';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDir, '../../..');

function main() {
    const dslRelative = process.argv[2];
    let outRelative = process.argv[3];

    if (!dslRelative) {
        console.error(
            `Usage: node ./generated/${productName}/scripts/generate-vsix.mjs <file${dslExtension}> [generated/${productName}/tools/out.ts]`
        );
        process.exit(1);
    }

    const dslPath = path.isAbsolute(dslRelative) ? dslRelative : path.join(projectRoot, dslRelative);
    if (path.dirname(dslPath) !== projectRoot) {
        console.error(
            `[generate-vsix] DSL must live at the workspace root (got ${path.relative(projectRoot, dslPath) || dslPath}).`
        );
        process.exit(1);
    }

    if (!outRelative) {
        const baseName = path.basename(dslPath, dslExtension);
        outRelative = path.join('generated', productName, 'tools', `${baseName}-tools.ts`);
    }

    const { scriptPath, embedHome } = resolveCliVsix();
    const outPath = path.isAbsolute(outRelative) ? outRelative : path.join(projectRoot, outRelative);
    const env = { ...process.env, [embedHomeEnvVar]: embedHome };

    execFileSync(process.execPath, [scriptPath, 'generate', dslPath, outPath], {
        stdio: 'inherit',
        cwd: projectRoot,
        env
    });
}

main();
