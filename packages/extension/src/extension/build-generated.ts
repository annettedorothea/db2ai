import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';
import * as vscode from 'vscode';

const execFileAsync = promisify(execFile);
const TSCONFIG_GENERATED = 'tsconfig.generated.json';

export type BuildGeneratedResult =
    | { ok: true }
    | {
          ok: false;
          reason: 'no-demo-root' | 'no-tsconfig' | 'no-typescript' | 'tsc-failed' | 'nested-dsl';
          message?: string;
      };

/**
 * Demo workspace root = directory of the DSL file when it contains
 * `generated/{hostProduct}/scripts/project-meta.mjs` (DSL must be at workspace root).
 */
export function findDemoProjectRoot(sourcePath: string, hostProduct: string): string | undefined {
    const dir = path.dirname(path.resolve(sourcePath));
    const marker = path.join(dir, 'generated', hostProduct, 'scripts', 'project-meta.mjs');
    if (existsSync(marker)) {
        return dir;
    }
    return undefined;
}

/** Same as `npm run build:generated` in a demo workspace (`tsc -p tsconfig.generated.json`). */
export async function runBuildGenerated(
    productLabel: string,
    sourcePath: string,
    hostProduct: string
): Promise<BuildGeneratedResult> {
    const demoRoot = findDemoProjectRoot(sourcePath, hostProduct);
    if (!demoRoot) {
        void vscode.window.showWarningMessage(
            `${productLabel}: DSL must be at the workspace root (next to generated/${hostProduct}/scripts/). Nested paths are not supported.`
        );
        return { ok: false, reason: 'nested-dsl' };
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
