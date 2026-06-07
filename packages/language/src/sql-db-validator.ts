import pg from 'pg';
import mysql from 'mysql2/promise';
import sql from 'mssql';
import oracledb from 'oracledb';
import type { Diagnostic } from 'vscode-languageserver';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { GrammarUtils } from 'langium';
import type { Model, SqlQuery } from './generated/ast.js';
import { isSqlQuery } from './generated/ast.js';
import { databaseDialectFromModel, isMysqlDialect, type ResolvedDatabaseDialect } from './dialect.js';
import { connectionUrlForMysqlDriver } from './dialect.js';
import { isSupportedConnectionUrlForDialect } from './dialect.js';
import { isValidEnvVarName, resolveDatabaseUrlFromEnvForDocument } from './schema.js';
import { coerceExampleValue } from './sql-param-spec.js';
import { buildExplainSqlForDialect } from './sql-db-probe.js';
import { parseSqlserverConnectInput } from './sqlserver-connection.js';
import { parseOracleConnectInput } from './oracle-connection.js';
import {
    extractUniqueNamedPlaceholders,
    mysqlBindValues,
    postgresBindValues,
    resolveSqlParamsOrdered
} from './sql-params.js';
import { probeDatabaseConnectivity } from './sql-db-connectivity.js';
import { formatDatabaseUnreachableReason, isDatabaseUnreachableError } from './sql-connection-error.js';

const SQL_DB_DIAGNOSTIC_SOURCE = 'db2ai-sql';
const DB_UNREACHABLE_QUERY_MESSAGE = 'DB validation skipped: database unreachable.';

function queryRange(sqlQuery: SqlQuery): {
    start: { line: number; character: number };
    end: { line: number; character: number };
} {
    const blockCst = sqlQuery.$cstNode;
    if (!blockCst) {
        return { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
    }

    const queryCst = GrammarUtils.findNodeForProperty(blockCst, 'query');
    const range = (queryCst ?? blockCst).range;
    return {
        start: { line: range.start.line, character: range.start.character },
        end: { line: range.end.line, character: range.end.character }
    };
}

function envRange(model: Model): {
    start: { line: number; character: number };
    end: { line: number; character: number };
} {
    const modelCst = model.$cstNode;
    if (!modelCst) {
        return { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
    }

    const envCst = GrammarUtils.findNodeForProperty(modelCst, 'env');
    const range = (envCst ?? modelCst).range;
    return {
        start: { line: range.start.line, character: range.start.character },
        end: { line: range.end.line, character: range.end.character }
    };
}

function buildExampleValueByName(sqlQuery: SqlQuery): {
    valueByName: Map<string, unknown>;
    missingExample: string[];
} {
    const sqlText = sqlQuery.query !== undefined ? String(sqlQuery.query) : '';
    const entries = sqlQuery.params?.entries ?? [];
    const ordered = resolveSqlParamsOrdered(entries, sqlText);
    const valueByName = new Map<string, unknown>();
    const missingExample: string[] = [];

    for (const p of ordered) {
        if (p.example === undefined || p.example.trim().length === 0) {
            missingExample.push(`:${p.name}`);
        } else {
            valueByName.set(p.name, coerceExampleValue(p.example, p.jsonSchemaType));
        }
    }

    return { valueByName, missingExample };
}

async function explainPostgresProbe(connectionUrl: string, sqlText: string, values: unknown[]): Promise<void> {
    const client = new pg.Client({ connectionString: connectionUrl });
    await client.connect();
    try {
        await client.query({ text: buildExplainSqlForDialect(sqlText, 'postgres'), values });
    } finally {
        await client.end();
    }
}

async function explainMysqlProbe(connectionUrl: string, sqlText: string, values: unknown[]): Promise<void> {
    const connection = await mysql.createConnection(connectionUrlForMysqlDriver(connectionUrl));
    try {
        await connection.query(
            buildExplainSqlForDialect(sqlText, 'mysql'),
            values as (string | number | boolean | null)[]
        );
    } finally {
        await connection.end();
    }
}

async function explainSqlserverProbe(
    connectionUrl: string,
    sqlText: string,
    valueByName: Map<string, unknown>
): Promise<void> {
    const pool = await sql.connect(parseSqlserverConnectInput(connectionUrl));
    try {
        const request = pool.request();
        for (const [name, value] of valueByName.entries()) {
            request.input(name, value);
        }
        await request.batch(buildExplainSqlForDialect(sqlText, 'sqlserver'));
    } finally {
        await pool.close();
    }
}

async function explainOracleProbe(
    connectionUrl: string,
    sqlText: string,
    valueByName: Map<string, unknown>
): Promise<void> {
    const connection = await oracledb.getConnection(parseOracleConnectInput(connectionUrl));
    try {
        const binds = Object.fromEntries(valueByName.entries());
        await connection.execute(buildExplainSqlForDialect(sqlText, 'oracle'), binds);
    } finally {
        await connection.close();
    }
}

async function probeSqlQuery(
    sqlQuery: SqlQuery,
    connectionUrl: string,
    dialect: ResolvedDatabaseDialect
): Promise<void> {
    const sqlText = sqlQuery.query !== undefined ? String(sqlQuery.query) : '';
    const { valueByName } = buildExampleValueByName(sqlQuery);
    const values = isMysqlDialect(dialect)
        ? mysqlBindValues(sqlText, valueByName)
        : postgresBindValues(sqlText, valueByName);

    if (isMysqlDialect(dialect)) {
        await explainMysqlProbe(connectionUrl, sqlText, values);
    } else if (dialect === 'sqlserver') {
        await explainSqlserverProbe(connectionUrl, sqlText, valueByName);
    } else if (dialect === 'oracle') {
        await explainOracleProbe(connectionUrl, sqlText, valueByName);
    } else {
        await explainPostgresProbe(connectionUrl, sqlText, values);
    }
}

function envUnreachableDiagnostic(model: Model, envName: string, err: unknown): Diagnostic {
    return {
        range: envRange(model),
        severity: DiagnosticSeverity.Warning,
        source: SQL_DB_DIAGNOSTIC_SOURCE,
        message: `DB validation skipped: cannot connect to database (${envName}): ${formatDatabaseUnreachableReason(err)}`
    };
}

function queryUnreachableDiagnostic(entry: SqlQuery): Diagnostic {
    return {
        range: queryRange(entry),
        severity: DiagnosticSeverity.Warning,
        source: SQL_DB_DIAGNOSTIC_SOURCE,
        message: DB_UNREACHABLE_QUERY_MESSAGE
    };
}

function querySqlErrorDiagnostic(entry: SqlQuery, err: unknown): Diagnostic {
    const message = err instanceof Error ? err.message : String(err);
    return {
        range: queryRange(entry),
        severity: DiagnosticSeverity.Error,
        source: SQL_DB_DIAGNOSTIC_SOURCE,
        message: `SQL validation failed: ${message}`
    };
}

export async function validateSqlBlocksWithExamples(model: Model, documentUri: string): Promise<Diagnostic[]> {
    const diagnostics: Diagnostic[] = [];
    const envName = model.env;
    if (envName === undefined || !isValidEnvVarName(String(envName))) {
        return diagnostics;
    }

    const connectionUrl = resolveDatabaseUrlFromEnvForDocument(String(envName), documentUri);
    const dialect = databaseDialectFromModel(model);
    if (connectionUrl === undefined || !isSupportedConnectionUrlForDialect(dialect, connectionUrl)) {
        return diagnostics;
    }

    const envNameText = String(envName);
    let databaseUnreachable = false;

    try {
        await probeDatabaseConnectivity(connectionUrl, dialect);
    } catch (err) {
        if (isDatabaseUnreachableError(err, dialect)) {
            databaseUnreachable = true;
            diagnostics.push(envUnreachableDiagnostic(model, envNameText, err));
        }
    }

    for (const entry of model.entries) {
        if (!isSqlQuery(entry)) {
            continue;
        }
        const sqlText = entry.query !== undefined ? String(entry.query) : '';
        const placeholders = extractUniqueNamedPlaceholders(sqlText);
        if (placeholders.length === 0) {
            continue;
        }

        const { missingExample } = buildExampleValueByName(entry);
        if (missingExample.length > 0) {
            diagnostics.push({
                range: queryRange(entry),
                severity: DiagnosticSeverity.Warning,
                source: SQL_DB_DIAGNOSTIC_SOURCE,
                message: `DB validation skipped: missing example for ${missingExample.join(', ')}.`
            });
            continue;
        }

        if (databaseUnreachable) {
            diagnostics.push(queryUnreachableDiagnostic(entry));
            continue;
        }

        try {
            await probeSqlQuery(entry, connectionUrl, dialect);
        } catch (err) {
            if (isDatabaseUnreachableError(err, dialect)) {
                databaseUnreachable = true;
                if (!diagnostics.some((d) => d.message.startsWith('DB validation skipped: cannot connect'))) {
                    diagnostics.push(envUnreachableDiagnostic(model, envNameText, err));
                }
                diagnostics.push(queryUnreachableDiagnostic(entry));
            } else {
                diagnostics.push(querySqlErrorDiagnostic(entry, err));
            }
        }
    }

    return diagnostics;
}
