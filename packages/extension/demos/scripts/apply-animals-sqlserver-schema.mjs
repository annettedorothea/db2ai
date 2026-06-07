#!/usr/bin/env node
/**
 * Apply animals T-SQL schema to the SQL Server demo container (idempotent).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const containerName = 'db2ai-animals-sqlserver';
const initSqlPath = path.join(demosRoot, 'animals-sqlserver', 'init.sql');
const saPassword = process.env.ANIMALS_SQLSERVER_SA_PASSWORD?.trim() || 'YourStrong!Passw0rd';

function sqlcmdArgs(extra) {
    return [
        'exec',
        '-i',
        containerName,
        '/opt/mssql-tools18/bin/sqlcmd',
        '-S',
        'localhost',
        '-U',
        'sa',
        '-P',
        saPassword,
        '-C',
        ...extra
    ];
}

function main() {
    const initSql = readFileSync(initSqlPath, 'utf-8');
    execFileSync('docker', sqlcmdArgs([]), {
        stdio: ['pipe', 'inherit', 'inherit'],
        input: initSql
    });
    console.log('[apply-animals-sqlserver-schema] schema applied');
}

main();
