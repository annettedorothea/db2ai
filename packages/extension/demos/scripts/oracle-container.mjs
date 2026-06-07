#!/usr/bin/env node
/**
 * Shared helpers for the plants-oracle Docker demo (sqlplus via /nolog + CONNECT).
 */
import { execFileSync } from 'node:child_process';

export const PLANTS_ORACLE_CONTAINER = 'db2ai-plants-oracle';
const CONNECT_HOST = '127.0.0.1';
const CONNECT_SERVICE = 'FREEPDB1';

export function plantsOracleSysPassword() {
    return process.env.PLANTS_ORACLE_SYS_PASSWORD?.trim() || process.env.ORACLE_PWD?.trim() || 'OracleDemo123';
}

export function plantsOracleConnectSql(password = plantsOracleSysPassword()) {
    return `CONNECT sys/${password}@//${CONNECT_HOST}:1521/${CONNECT_SERVICE} AS SYSDBA`;
}

/**
 * Run SQL*Plus in /nolog mode with a CONNECT preamble. Exits non-zero on SQL errors.
 *
 * @param {string} sqlBody
 * @param {{ silent?: boolean }} [options]
 */
export function runPlantsOracleSqlplus(sqlBody, options = {}) {
    const script = `WHENEVER SQLERROR EXIT FAILURE
${plantsOracleConnectSql()}
${sqlBody}
`;
    execFileSync('docker', ['exec', '-i', PLANTS_ORACLE_CONTAINER, 'sqlplus', '-s', '/nolog'], {
        input: script,
        stdio: options.silent ? 'pipe' : ['pipe', 'inherit', 'inherit']
    });
}

/**
 * @returns {boolean}
 */
export function probePlantsOracleReady() {
    try {
        runPlantsOracleSqlplus(
            `SELECT 1 FROM dual;
EXIT;
`,
            { silent: true }
        );
        return true;
    } catch {
        return false;
    }
}
