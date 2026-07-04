#!/usr/bin/env node
/**
 * Create `.env` from `.env.example` when missing (never overwrites existing `.env`).
 */
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @returns {boolean} true when a new `.env` was created */
export function ensureEnvFromExample(root = demosRoot) {
    const example = path.join(root, '.env.example');
    const target = path.join(root, '.env');
    if (existsSync(target)) {
        return false;
    }
    if (!existsSync(example)) {
        console.error('[copy-env] Missing .env.example in demo workspace.');
        process.exit(1);
    }
    copyFileSync(example, target);
    console.log('[copy-env] Created .env from .env.example — edit secrets locally.');
    return true;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
    if (ensureEnvFromExample()) {
        process.exit(0);
    }
    console.log('[copy-env] .env already exists — not overwritten.');
}
