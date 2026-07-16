#!/usr/bin/env node
/**
 * Refresh `generated/{product}/scripts/*.mjs` from @toolfactory.dev/core.
 * Bootstrap helper for extension developers (also runs after CLI generate).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeGeneratedScripts } from '@toolfactory.dev/core/codegen';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
writeGeneratedScripts(projectRoot, 'db2ai');
console.log('[sync-generated-scripts] updated generated/db2ai/scripts/*.mjs');
