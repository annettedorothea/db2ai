import { spawnSync } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('committed generated output compiles', () => {
    it('compiles generated/**/*.ts (+ auth stubs) in demos workspace', () => {
        const result = spawnSync('npm', ['run', 'build:generated'], {
            cwd: demosRoot,
            encoding: 'utf-8',
            shell: process.platform === 'win32'
        });
        const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
        expect(result.status, output).toBe(0);
    });
});
