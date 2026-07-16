import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tscBin = path.join(demosRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const ensureStampScript = path.join(demosRoot, 'generated', 'db2ai', 'scripts', 'ensure-mcp-build-stamp.mjs');

describe('committed generated output compiles', () => {
    it('compiles generated/**/*.ts (+ auth stubs) in demos workspace', () => {
        expect(existsSync(tscBin), 'run npm install in demos workspace').toBe(true);
        const ensure = spawnSync(process.execPath, [ensureStampScript], { cwd: demosRoot, encoding: 'utf-8' });
        expect(ensure.status, [ensure.stdout, ensure.stderr].filter(Boolean).join('\n')).toBe(0);
        const result = spawnSync(process.execPath, [tscBin, '-p', 'tsconfig.generated.json'], {
            cwd: demosRoot,
            encoding: 'utf-8'
        });
        const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
        expect(result.status, output).toBe(0);
    }, 30_000);
});
