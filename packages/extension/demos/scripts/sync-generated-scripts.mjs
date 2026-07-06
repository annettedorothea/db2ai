#!/usr/bin/env node
/**
 * Refresh `scripts/generated/*.mjs` from @toolfactory.dev/core (npm).
 * Uses registry core, not the VSIX embed CLI — keeps utility scripts in sync when an older extension is installed.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeGeneratedScripts } from '@toolfactory.dev/core/codegen';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
writeGeneratedScripts(projectRoot);
console.log('[sync-generated-scripts] updated scripts/generated/*.mjs');
