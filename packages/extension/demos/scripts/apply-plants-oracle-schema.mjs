#!/usr/bin/env node
/**
 * Apply plants Oracle schema to the Oracle Free demo container (idempotent).
 */
import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPlantsOracleSqlplus } from './oracle-container.mjs';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const initSqlPath = path.join(demosRoot, 'plants-oracle', 'init.sql');

function main() {
    const initSql = readFileSync(initSqlPath, 'utf-8');
    runPlantsOracleSqlplus(`${initSql}
EXIT;
`);
    console.log('[apply-plants-oracle-schema] schema applied');
}

main();
