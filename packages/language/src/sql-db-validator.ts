import pg from 'pg';
import mysql from 'mysql2/promise';
import type { Diagnostic } from 'vscode-languageserver';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { GrammarUtils } from 'langium';
import type { Model, SqlQuery } from './generated/ast.js';
import { isSqlQuery } from './generated/ast.js';
import { databaseDialectFromModel, type ResolvedDatabaseDialect } from './dialect.js';
import { isSupportedConnectionUrlForDialect } from './dialect.js';
import { isValidEnvVarName, resolveDatabaseUrlFromEnvForDocument } from './schema.js';
import { coerceExampleValue } from './sql-param-spec.js';
import { buildMysqlExplainSql, buildPostgresExplainSql } from './sql-db-probe.js';
import {
    extractPlaceholderNumbers,
    mysqlBindValues,
    postgresBindValues,
    resolveSqlParamsOrdered
} from './sql-params.js';

const SQL_DB_DIAGNOSTIC_SOURCE = 'db2ai-sql';

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

function buildExampleValueByIndex(sqlQuery: SqlQuery): {
    valueByIndex: Map<number, unknown>;
    missingExample: string[];
} {
    const sqlText = sqlQuery.query !== undefined ? String(sqlQuery.query) : '';
    const entries = sqlQuery.params?.entries ?? [];
    const ordered = resolveSqlParamsOrdered(entries, sqlText);
    const valueByIndex = new Map<number, unknown>();
    const missingExample: string[] = [];

    for (const p of ordered) {
        if (p.example === undefined || p.example.trim().length === 0) {
            missingExample.push(p.placeholder);
        } else {
            valueByIndex.set(p.index, coerceExampleValue(p.example, p.jsonSchemaType));
        }
    }

    return { valueByIndex, missingExample };
}

async function explainPostgresProbe(connectionUrl: string, sqlText: string, values: unknown[]): Promise<void> {
    const client = new pg.Client({ connectionString: connectionUrl });
    await client.connect();
    try {
        await client.query({ text: buildPostgresExplainSql(sqlText), values });
    } finally {
        await client.end();
    }
}

async function explainMysqlProbe(connectionUrl: string, sqlText: string, values: unknown[]): Promise<void> {
    const connection = await mysql.createConnection(connectionUrl);
    try {
        await connection.query(buildMysqlExplainSql(sqlText), values as (string | number | boolean | null)[]);
    } finally {
        await connection.end();
    }
}

async function probeSqlQuery(
    sqlQuery: SqlQuery,
    connectionUrl: string,
    dialect: ResolvedDatabaseDialect
): Promise<void> {
    const sqlText = sqlQuery.query !== undefined ? String(sqlQuery.query) : '';
    const { valueByIndex } = buildExampleValueByIndex(sqlQuery);
    const values =
        dialect === 'mysql' ? mysqlBindValues(sqlText, valueByIndex) : postgresBindValues(sqlText, valueByIndex);

    if (dialect === 'mysql') {
        await explainMysqlProbe(connectionUrl, sqlText, values);
    } else {
        await explainPostgresProbe(connectionUrl, sqlText, values);
    }
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

    const range = (sqlQuery: SqlQuery) => ({
        range: queryRange(sqlQuery),
        severity: DiagnosticSeverity.Error,
        source: SQL_DB_DIAGNOSTIC_SOURCE
    });

    for (const entry of model.entries) {
        if (!isSqlQuery(entry)) {
            continue;
        }
        const sqlText = entry.query !== undefined ? String(entry.query) : '';
        const placeholders = extractPlaceholderNumbers(sqlText);
        if (placeholders.length === 0) {
            continue;
        }

        const { missingExample } = buildExampleValueByIndex(entry);
        if (missingExample.length > 0) {
            diagnostics.push({
                ...range(entry),
                severity: DiagnosticSeverity.Warning,
                message: `DB validation skipped: missing example for ${missingExample.join(', ')}.`
            });
            continue;
        }

        try {
            await probeSqlQuery(entry, connectionUrl, dialect);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            diagnostics.push({
                ...range(entry),
                message: `SQL validation failed: ${message}`
            });
        }
    }

    return diagnostics;
}
