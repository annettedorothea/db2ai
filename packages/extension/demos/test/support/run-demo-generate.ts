import { execFileSync } from 'node:child_process';
import * as path from 'node:path';
import { demosRoot } from './paths.js';

/** Run `scripts/generate.mjs` (monorepo CLI, VSIX embed, or env override). Accepts absolute paths for tmp fixtures. */
export function runDemoGenerate(dslPath: string, outPath: string): void {
    const script = path.join(demosRoot, 'scripts/generate.mjs');
    execFileSync(process.execPath, [script, dslPath, outPath], {
        cwd: demosRoot,
        stdio: 'inherit'
    });
}
