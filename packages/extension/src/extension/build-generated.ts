import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';
import * as vscode from 'vscode';

const execFileAsync = promisify(execFile);
const DEMO_GENERATE_CONFIG = 'demos-generate.config.json';
const TSCONFIG_GENERATED = 'tsconfig.generated.json';

export type BuildGeneratedResult =
    | { ok: true }
    | {
          ok: false;
          reason: 'no-demo-root' | 'no-tsconfig' | 'no-typescript' | 'tsc-failed';
          message?: string;
      };

export function findDemoProjectRoot(sourcePath: string): string | undefined {
    let dir = path.dirname(path.resolve(sourcePath));
    while (true) {
        if (existsSync(path.join(dir, DEMO_GENERATE_CONFIG))) {
            return dir;
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            return undefined;
        }
        dir = parent;
    }
}

/** Same as `npm run build:generated` in a demo workspace (`tsc -p tsconfig.generated.json`). */
export async function runBuildGenerated(productLabel: string, sourcePath: string): Promise<BuildGeneratedResult> {
    const demoRoot = findDemoProjectRoot(sourcePath);
    if (!demoRoot) {
        return { ok: false, reason: 'no-demo-root' };
    }

    const tsconfigPath = path.join(demoRoot, TSCONFIG_GENERATED);
    if (!existsSync(tsconfigPath)) {
        return { ok: false, reason: 'no-tsconfig' };
    }

    const tscBin = path.join(demoRoot, 'node_modules', 'typescript', 'bin', 'tsc');
    if (!existsSync(tscBin)) {
        void vscode.window.showWarningMessage(
            `${productLabel}: run \`npm install\` in ${demoRoot} to compile generated .js for MCP.`
        );
        return { ok: false, reason: 'no-typescript' };
    }

    try {
        await execFileAsync(process.execPath, [tscBin, '-p', TSCONFIG_GENERATED], {
            cwd: demoRoot,
            maxBuffer: 10 * 1024 * 1024
        });
        return { ok: true };
    } catch (error) {
        const stderr =
            error && typeof error === 'object' && 'stderr' in error
                ? String((error as { stderr?: Buffer | string }).stderr ?? '')
                : '';
        const message = (stderr.trim() || (error instanceof Error ? error.message : String(error))).slice(0, 800);
        void vscode.window.showWarningMessage(`${productLabel}: compile generated .js failed: ${message}`);
        return { ok: false, reason: 'tsc-failed', message };
    }
}
