import type { ResolvedDatabaseDialect, SqlParamType } from 'db-2-ai-dsl-language';
import { isMysqlDialect, isOracleNumericReturningColumn, prepareOracleDmlReturning } from 'db-2-ai-dsl-language';
import type { ResolvedDbToolCodegen, ResolvedSqlToolCodegen } from '../db-query-codegen.js';
import { renderInvokeAuthPipeline, type AuthPipelineTier, type HookStubMaps } from './render-check-stubs.js';

function renderOptionValueExpression(
    propertyName: string,
    dialect: ResolvedDatabaseDialect,
    paramType: SqlParamType,
    optionsVar: string
): string {
    const optionAccess = `${optionsVar}[${JSON.stringify(propertyName)}]`;
    if (isMysqlDialect(dialect)) {
        if (paramType === 'boolean') {
            return `normalizeMysqlBooleanParamValue(${optionAccess})`;
        }
        return `normalizeMysqlParamValue(${optionAccess})`;
    }
    if (dialect === 'sqlserver') {
        if (paramType === 'integer' || paramType === 'number') {
            return `normalizeSqlserverNumericParamValue(${optionAccess})`;
        }
        if (paramType === 'boolean') {
            return `normalizeSqlserverBooleanParamValue(${optionAccess})`;
        }
        return `${optionAccess} !== undefined && ${optionAccess} !== null ? String(${optionAccess}) : null`;
    }
    if (dialect === 'oracle') {
        if (paramType === 'integer' || paramType === 'number') {
            return `normalizeOracleNumericParamValue(${optionAccess})`;
        }
        if (paramType === 'boolean') {
            return `normalizeOracleBooleanParamValue(${optionAccess})`;
        }
        return `${optionAccess} !== undefined && ${optionAccess} !== null ? String(${optionAccess}) : null`;
    }
    if (paramType === 'integer' || paramType === 'number') {
        return `normalizePostgresNumericParamValue(${optionAccess})`;
    }
    if (paramType === 'boolean') {
        return `normalizePostgresBooleanParamValue(${optionAccess})`;
    }
    return `${optionAccess} !== undefined && ${optionAccess} !== null ? String(${optionAccess}) : null`;
}

/** Postgres: one bind per param in order. MySQL: one per `?` (param names from logical SQL). */
export function collectSqlBindValueExpressions(
    tool: ResolvedSqlToolCodegen,
    dialect: ResolvedDatabaseDialect,
    optionsVar: string
): string[] {
    const paramsByName = new Map(tool.params.map((p) => [p.propertyName, p]));
    if (isMysqlDialect(dialect)) {
        const bindNames = tool.mysqlBindNames ?? [];
        return bindNames.map((name) => {
            const param = paramsByName.get(name);
            if (!param) {
                throw new Error(`Codegen: SQL query references :${name}, but no matching param was resolved.`);
            }
            return renderOptionValueExpression(param.propertyName, dialect, param.jsonSchemaType, optionsVar);
        });
    }
    return tool.params.map((param) =>
        renderOptionValueExpression(param.propertyName, dialect, param.jsonSchemaType, optionsVar)
    );
}

function renderSqlserverParamType(paramType: SqlParamType): string {
    switch (paramType) {
        case 'integer':
            return 'sql.Int';
        case 'number':
            return 'sql.Decimal(10, 2)';
        case 'boolean':
            return 'sql.Bit';
        default:
            return 'sql.NVarChar(sql.MAX)';
    }
}

function renderSqlserverInputLines(tool: ResolvedSqlToolCodegen, optionsVar: string): string {
    return tool.params
        .map((param) => {
            const valueExpr = renderOptionValueExpression(
                param.propertyName,
                'sqlserver',
                param.jsonSchemaType,
                optionsVar
            );
            return `            request.input(${JSON.stringify(param.name)}, ${renderSqlserverParamType(param.jsonSchemaType)}, ${valueExpr});`;
        })
        .join('\n');
}

function renderOracleBindObjectLines(tool: ResolvedSqlToolCodegen, optionsVar: string): string {
    return tool.params
        .map((param) => {
            const valueExpr = renderOptionValueExpression(
                param.propertyName,
                'oracle',
                param.jsonSchemaType,
                optionsVar
            );
            return `                ${JSON.stringify(param.name)}: ${valueExpr},`;
        })
        .join('\n');
}

function renderOracleOutBindLines(tool: ResolvedSqlToolCodegen): string {
    const prepared = prepareOracleDmlReturning(tool.sqlText);
    if (!prepared) {
        return '';
    }
    return prepared.outBindNames
        .map((name, index) => {
            const column = prepared.returningColumns[index];
            if (isOracleNumericReturningColumn(column)) {
                return `                ${JSON.stringify(name)}: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },`;
            }
            return `                ${JSON.stringify(name)}: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 4000 },`;
        })
        .join('\n');
}

function renderSqlInvokeCase(
    tool: ResolvedSqlToolCodegen,
    dialect: ResolvedDatabaseDialect,
    optionsVar: string
): string {
    if (dialect === 'oracle') {
        const prepared = prepareOracleDmlReturning(tool.sqlText);
        const bindLines = renderOracleBindObjectLines(tool, optionsVar);
        const outBindLines = renderOracleOutBindLines(tool);
        const resultRowsExpr = prepared
            ? `rowsFromOracleDmlReturning(result.outBinds, ${JSON.stringify(prepared.returningColumns)}, ${JSON.stringify(prepared.outBindNames)})`
            : 'Array.isArray(result.rows) ? result.rows : []';
        return `        case ${JSON.stringify(tool.toolName)}: {
            const sqlText = ${JSON.stringify(prepared?.sqlText ?? tool.sqlText)};
            const binds = {
${bindLines}${outBindLines.length > 0 ? `\n${outBindLines}` : ''}
            };
            loggingAdapter.debug('executeSql', {
                toolName: ${JSON.stringify(tool.toolName)},
                sql: compactSqlForLog(sqlText),
                values: binds
            });
            const result = await connection.execute(sqlText, binds, {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
                autoCommit: true
            });
            const resultRows = ${resultRowsExpr};
            return {
                rows: resultRows,
                rowCount: resultRows.length
            };
        }`;
    }
    if (dialect === 'sqlserver') {
        const inputLines = renderSqlserverInputLines(tool, optionsVar);
        return `        case ${JSON.stringify(tool.toolName)}: {
            const sqlText = ${JSON.stringify(tool.sqlText)};
            const request = pool.request();
${inputLines}
            loggingAdapter.debug('executeSql', {
                toolName: ${JSON.stringify(tool.toolName)},
                sql: compactSqlForLog(sqlText),
                values: {
${tool.params.map((p) => `                    ${JSON.stringify(p.name)}: ${optionsVar}[${JSON.stringify(p.propertyName)}],`).join('\n')}
                }
            });
            const result = await request.query(sqlText);
            const resultRows = Array.isArray(result.recordset) ? result.recordset : [];
            return {
                rows: resultRows,
                rowCount: resultRows.length
            };
        }`;
    }
    const valueExprs = collectSqlBindValueExpressions(tool, dialect, optionsVar).join(', ');
    if (isMysqlDialect(dialect)) {
        return `        case ${JSON.stringify(tool.toolName)}: {
            const sqlText = ${JSON.stringify(tool.sqlText)};
            const sqlValues = [${valueExprs}];
            loggingAdapter.debug('executeSql', {
                toolName: ${JSON.stringify(tool.toolName)},
                sql: compactSqlForLog(sqlText),
                values: sqlValues
            });
            const [rows] = await client.query(sqlText, sqlValues);
            const resultRows = normalizeMysqlRows(rows);
            return {
                rows: resultRows,
                rowCount: resultRows.length
            };
        }`;
    }
    return `        case ${JSON.stringify(tool.toolName)}: {
            const sqlText = ${JSON.stringify(tool.sqlText)};
            const sqlValues = [${valueExprs}];
            loggingAdapter.debug('executeSql', {
                toolName: ${JSON.stringify(tool.toolName)},
                sql: compactSqlForLog(sqlText),
                values: sqlValues
            });
            const result = await client.query({ text: sqlText, values: sqlValues });
            return {
                rows: result.rows,
                rowCount: result.rowCount ?? result.rows.length
            };
        }`;
}

type InvokeParamHelperFlags = {
    postgresNumeric: boolean;
    postgresBoolean: boolean;
    mysqlBoolean: boolean;
    sqlserverNumeric: boolean;
    sqlserverBoolean: boolean;
    oracleNumeric: boolean;
    oracleBoolean: boolean;
    oracleDmlReturning: boolean;
};

function resolveInvokeParamHelperFlags(tools: ResolvedDbToolCodegen[]): InvokeParamHelperFlags {
    const flags: InvokeParamHelperFlags = {
        postgresNumeric: false,
        postgresBoolean: false,
        mysqlBoolean: false,
        sqlserverNumeric: false,
        sqlserverBoolean: false,
        oracleNumeric: false,
        oracleBoolean: false,
        oracleDmlReturning: false
    };
    for (const tool of tools) {
        if (prepareOracleDmlReturning(tool.sqlText)) {
            flags.oracleDmlReturning = true;
        }
        for (const param of tool.params) {
            if (param.jsonSchemaType === 'integer' || param.jsonSchemaType === 'number') {
                flags.postgresNumeric = true;
                flags.sqlserverNumeric = true;
                flags.oracleNumeric = true;
            }
            if (param.jsonSchemaType === 'boolean') {
                flags.postgresBoolean = true;
                flags.mysqlBoolean = true;
                flags.sqlserverBoolean = true;
                flags.oracleBoolean = true;
            }
        }
    }
    return flags;
}

function renderInvokeSwitchCases(
    tools: ResolvedDbToolCodegen[],
    dialect: ResolvedDatabaseDialect,
    optionsVar: string
): string {
    return tools.map((tool) => renderSqlInvokeCase(tool, dialect, optionsVar)).join('\n');
}

function renderOptionsResolvedInit(authPipelineTier: AuthPipelineTier): string {
    if (authPipelineTier === 'none') {
        return '';
    }
    return `
    let optionsResolved = options;`;
}

function renderHostBinding(typescript: boolean): string {
    const guard = `
    if (hostContext === undefined) {
        throw new Error(
            'invokeTool requires hostContext from the MCP host (servers/*-mcp-server).'
        );
    }`;
    if (typescript) {
        return `${guard}
    const host = hostContext as DbHostContext;`;
    }
    return `${guard}
    const host = hostContext;`;
}

function renderPostgresClientSetup(typescript: boolean): string {
    if (typescript) {
        return `
    const connectionString = resolveConnectionString(host);
    const client = new Client({ connectionString });
    await client.connect();`;
    }
    return `
    const connectionString = resolveConnectionString(host);
    const client = new pg.Client({ connectionString });
    await client.connect();`;
}

function renderInvokeToolPreamble(
    hasAuth: boolean,
    authPipelineTier: AuthPipelineTier,
    stubMaps: HookStubMaps,
    typescript: boolean
): string {
    const accessChecks =
        authPipelineTier === 'none' ? '' : renderInvokeAuthPipeline(authPipelineTier, hasAuth, stubMaps);
    return `
    const toolMeta = generatedTools.find((t) => t.toolName === toolName);
    if (!toolMeta) {
        throw new Error('Unknown tool: ' + toolName);
    }
    loggingAdapter.debug('invokeTool', { toolName });
${renderHostBinding(typescript)}${renderOptionsResolvedInit(authPipelineTier)}${accessChecks}${renderPostgresClientSetup(typescript)}
    try {
        switch (toolName) {`;
}

function renderInvokeToolPreambleMysql(
    hasAuth: boolean,
    authPipelineTier: AuthPipelineTier,
    stubMaps: HookStubMaps,
    typescript: boolean
): string {
    const accessChecks =
        authPipelineTier === 'none' ? '' : renderInvokeAuthPipeline(authPipelineTier, hasAuth, stubMaps);
    return `
    const toolMeta = generatedTools.find((t) => t.toolName === toolName);
    if (!toolMeta) {
        throw new Error('Unknown tool: ' + toolName);
    }
    loggingAdapter.debug('invokeTool', { toolName });
${renderHostBinding(typescript)}${renderOptionsResolvedInit(authPipelineTier)}${accessChecks}
    const connectionString = connectionUrlForMysqlDriver(resolveConnectionString(host));
    const client = await mysql.createConnection(connectionString);
    try {
        switch (toolName) {`;
}

const COMPACT_SQL_FOR_LOG_TS = `
function compactSqlForLog(sql: string): string {
    return sql.replace(/\\s+/g, ' ').trim();
}
`.trim();

const COMPACT_SQL_FOR_LOG_JS = `
function compactSqlForLog(sql) {
    return sql.replace(/\\s+/g, ' ').trim();
}
`.trim();

function renderInvokeOptionsParam(
    hasSqlTools: boolean,
    authPipelineTier: AuthPipelineTier,
    typescript: boolean
): string {
    const name = hasSqlTools || authPipelineTier !== 'none' ? 'options' : '_options';
    return typescript ? `${name}: InvokeOptions = {}` : `${name} = {}`;
}

const CONNECTION_URL_FOR_MYSQL_DRIVER_TS = `
function connectionUrlForMysqlDriver(connectionUrl: string): string {
    const trimmed = connectionUrl.trim();
    if (trimmed.startsWith('mariadb://')) {
        return \`mysql://\${trimmed.slice('mariadb://'.length)}\`;
    }
    return trimmed;
}
`.trim();

const CONNECTION_URL_FOR_MYSQL_DRIVER_JS = `
function connectionUrlForMysqlDriver(connectionUrl) {
    const trimmed = connectionUrl.trim();
    if (trimmed.startsWith('mariadb://')) {
        return 'mysql://' + trimmed.slice('mariadb://'.length);
    }
    return trimmed;
}
`.trim();

const POSTGRES_NUMERIC_HELPER_TS = `
function normalizePostgresNumericParamValue(value: unknown): number | null {
    if (value === undefined || value === null) {
        return null;
    }
    const n = typeof value === 'number' ? value : Number(String(value));
    return Number.isFinite(n) ? n : null;
}
`.trim();

const POSTGRES_BOOLEAN_HELPER_TS = `
function normalizePostgresBooleanParamValue(value: unknown): boolean | null {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    const lower = String(value).trim().toLowerCase();
    if (lower === 'true') {
        return true;
    }
    if (lower === 'false') {
        return false;
    }
    return null;
}
`.trim();

const POSTGRES_NUMERIC_HELPER_JS = `
function normalizePostgresNumericParamValue(value) {
    if (value === undefined || value === null) {
        return null;
    }
    const n = typeof value === 'number' ? value : Number(String(value));
    return Number.isFinite(n) ? n : null;
}
`.trim();

const POSTGRES_BOOLEAN_HELPER_JS = `
function normalizePostgresBooleanParamValue(value) {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    const lower = String(value).trim().toLowerCase();
    if (lower === 'true') {
        return true;
    }
    if (lower === 'false') {
        return false;
    }
    return null;
}
`.trim();

const MYSQL_BOOLEAN_HELPER_TS = `
function normalizeMysqlBooleanParamValue(value: unknown): boolean | null {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    const lower = String(value).trim().toLowerCase();
    if (lower === 'true') {
        return true;
    }
    if (lower === 'false') {
        return false;
    }
    return null;
}
`.trim();

const MYSQL_BOOLEAN_HELPER_JS = `
function normalizeMysqlBooleanParamValue(value) {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    const lower = String(value).trim().toLowerCase();
    if (lower === 'true') {
        return true;
    }
    if (lower === 'false') {
        return false;
    }
    return null;
}
`.trim();

function renderPostgresInvokeBlockTs(
    toolCases: string,
    flags: InvokeParamHelperFlags,
    hasAuth: boolean,
    authPipelineTier: AuthPipelineTier,
    stubMaps: HookStubMaps,
    hasSqlTools: boolean,
    optionsParam: string
): string {
    const preamble = renderInvokeToolPreamble(hasAuth, authPipelineTier, stubMaps, true);
    const helpers = [
        hasSqlTools ? COMPACT_SQL_FOR_LOG_TS : '',
        flags.postgresNumeric ? POSTGRES_NUMERIC_HELPER_TS : '',
        flags.postgresBoolean ? POSTGRES_BOOLEAN_HELPER_TS : ''
    ]
        .filter((block) => block.length > 0)
        .join('\n\n');
    const helperSection = `\n\n${helpers}`;
    return `
import { Client } from 'pg';

function resolveConnectionString(hostContext: DbHostContext): string {
    const cs = hostContext.connectionString?.trim();
    if (cs) {
        return cs;
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}${helperSection}

export async function invokeTool(
    toolName: string,
    ${optionsParam},
    hostContext?: DbHostContext
): Promise<unknown> {${preamble}
${toolCases}
            default:
                throw new Error('Unknown tool: ' + toolName);
        }
    } finally {
        await client.end();
    }
}
`.trim();
}

function renderPostgresInvokeBlockJs(
    toolCases: string,
    flags: InvokeParamHelperFlags,
    hasAuth: boolean,
    authPipelineTier: AuthPipelineTier,
    stubMaps: HookStubMaps,
    hasSqlTools: boolean,
    optionsParam: string
): string {
    const preamble = renderInvokeToolPreamble(hasAuth, authPipelineTier, stubMaps, false);
    const helpers = [
        hasSqlTools ? COMPACT_SQL_FOR_LOG_JS : '',
        flags.postgresNumeric ? POSTGRES_NUMERIC_HELPER_JS : '',
        flags.postgresBoolean ? POSTGRES_BOOLEAN_HELPER_JS : ''
    ]
        .filter((block) => block.length > 0)
        .join('\n\n');
    const helperSection = `\n\n${helpers}`;
    return `
import pg from 'pg';

function resolveConnectionString(hostContext) {
    if (hostContext && typeof hostContext === 'object' && hostContext.connectionString != null) {
        const cs = String(hostContext.connectionString).trim();
        if (cs.length > 0) {
            return cs;
        }
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}${helperSection}

export async function invokeTool(toolName, ${optionsParam}, hostContext) {${preamble}
${toolCases}
            default:
                throw new Error('Unknown tool: ' + toolName);
        }
    } finally {
        await client.end();
    }
}
`.trim();
}

function renderMysqlInvokeBlockTs(
    toolCases: string,
    flags: InvokeParamHelperFlags,
    hasAuth: boolean,
    authPipelineTier: AuthPipelineTier,
    stubMaps: HookStubMaps,
    hasSqlTools: boolean,
    optionsParam: string
): string {
    const preamble = renderInvokeToolPreambleMysql(hasAuth, authPipelineTier, stubMaps, true);
    const mysqlHelpers = [hasSqlTools ? COMPACT_SQL_FOR_LOG_TS : '', flags.mysqlBoolean ? MYSQL_BOOLEAN_HELPER_TS : '']
        .filter((block) => block.length > 0)
        .join('\n\n');
    const helperSection = `\n\n${mysqlHelpers}`;
    return `
import mysql from 'mysql2/promise';

function resolveConnectionString(hostContext: DbHostContext): string {
    const cs = hostContext.connectionString?.trim();
    if (cs) {
        return cs;
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}

function normalizeMysqlRows(rows: unknown): unknown[] {
    return Array.isArray(rows) ? rows : [];
}

function normalizeMysqlParamValue(value: unknown): string | number | null {
    if (value === undefined || value === null) {
        return null;
    }
    const text = String(value);
    const trimmed = text.trim();
    if (/^-?\\d+(?:\\.\\d+)?$/.test(trimmed)) {
        return Number(trimmed);
    }
    return text;
}

${CONNECTION_URL_FOR_MYSQL_DRIVER_TS}${helperSection}

export async function invokeTool(
    toolName: string,
    ${optionsParam},
    hostContext?: DbHostContext
): Promise<unknown> {${preamble}
${toolCases}
            default:
                throw new Error('Unknown tool: ' + toolName);
        }
    } finally {
        await client.end();
    }
}
`.trim();
}

function renderMysqlInvokeBlockJs(
    toolCases: string,
    flags: InvokeParamHelperFlags,
    hasAuth: boolean,
    authPipelineTier: AuthPipelineTier,
    stubMaps: HookStubMaps,
    hasSqlTools: boolean,
    optionsParam: string
): string {
    const preamble = renderInvokeToolPreambleMysql(hasAuth, authPipelineTier, stubMaps, false);
    const mysqlHelpers = [hasSqlTools ? COMPACT_SQL_FOR_LOG_JS : '', flags.mysqlBoolean ? MYSQL_BOOLEAN_HELPER_JS : '']
        .filter((block) => block.length > 0)
        .join('\n\n');
    const helperSection = `\n\n${mysqlHelpers}`;
    return `
import mysql from 'mysql2/promise';

function resolveConnectionString(hostContext) {
    if (hostContext && typeof hostContext === 'object' && hostContext.connectionString != null) {
        const cs = String(hostContext.connectionString).trim();
        if (cs.length > 0) {
            return cs;
        }
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}

function normalizeMysqlRows(rows) {
    return Array.isArray(rows) ? rows : [];
}

function normalizeMysqlParamValue(value) {
    if (value === undefined || value === null) {
        return null;
    }
    const text = String(value);
    const trimmed = text.trim();
    if (/^-?\\d+(?:\\.\\d+)?$/.test(trimmed)) {
        return Number(trimmed);
    }
    return text;
}

${CONNECTION_URL_FOR_MYSQL_DRIVER_JS}${helperSection}

export async function invokeTool(toolName, ${optionsParam}, hostContext) {${preamble}
${toolCases}
            default:
                throw new Error('Unknown tool: ' + toolName);
        }
    } finally {
        await client.end();
    }
}
`.trim();
}

const SQLSERVER_NUMERIC_HELPER_TS = `
function normalizeSqlserverNumericParamValue(value: unknown): number | null {
    if (value === undefined || value === null) {
        return null;
    }
    const n = typeof value === 'number' ? value : Number(String(value));
    return Number.isFinite(n) ? n : null;
}
`.trim();

const SQLSERVER_BOOLEAN_HELPER_TS = `
function normalizeSqlserverBooleanParamValue(value: unknown): boolean | null {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    const lower = String(value).trim().toLowerCase();
    if (lower === 'true') {
        return true;
    }
    if (lower === 'false') {
        return false;
    }
    return null;
}
`.trim();

const SQLSERVER_NUMERIC_HELPER_JS = `
function normalizeSqlserverNumericParamValue(value) {
    if (value === undefined || value === null) {
        return null;
    }
    const n = typeof value === 'number' ? value : Number(String(value));
    return Number.isFinite(n) ? n : null;
}
`.trim();

const SQLSERVER_BOOLEAN_HELPER_JS = `
function normalizeSqlserverBooleanParamValue(value) {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    const lower = String(value).trim().toLowerCase();
    if (lower === 'true') {
        return true;
    }
    if (lower === 'false') {
        return false;
    }
    return null;
}
`.trim();

const ORACLE_NUMERIC_HELPER_TS = `
function normalizeOracleNumericParamValue(value: unknown): number | null {
    if (value === undefined || value === null) {
        return null;
    }
    const n = typeof value === 'number' ? value : Number(String(value));
    return Number.isFinite(n) ? n : null;
}
`.trim();

const ORACLE_BOOLEAN_HELPER_TS = `
function normalizeOracleBooleanParamValue(value: unknown): boolean | null {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    const lower = String(value).trim().toLowerCase();
    if (lower === 'true') {
        return true;
    }
    if (lower === 'false') {
        return false;
    }
    return null;
}
`.trim();

const ORACLE_NUMERIC_HELPER_JS = `
function normalizeOracleNumericParamValue(value) {
    if (value === undefined || value === null) {
        return null;
    }
    const n = typeof value === 'number' ? value : Number(String(value));
    return Number.isFinite(n) ? n : null;
}
`.trim();

const ORACLE_BOOLEAN_HELPER_JS = `
function normalizeOracleBooleanParamValue(value) {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    const lower = String(value).trim().toLowerCase();
    if (lower === 'true') {
        return true;
    }
    if (lower === 'false') {
        return false;
    }
    return null;
}
`.trim();

const ORACLE_DML_RETURNING_HELPER_TS = `
function rowsFromOracleDmlReturning(
    outBinds: Record<string, unknown[]> | undefined,
    columns: string[],
    bindNames: string[]
): Record<string, unknown>[] {
    if (!outBinds || columns.length === 0) {
        return [];
    }
    const row: Record<string, unknown> = {};
    for (let index = 0; index < columns.length; index++) {
        const values = outBinds[bindNames[index]];
        row[columns[index].toUpperCase()] =
            Array.isArray(values) && values.length > 0 ? values[0] : null;
    }
    return [row];
}
`.trim();

const ORACLE_DML_RETURNING_HELPER_JS = `
function rowsFromOracleDmlReturning(outBinds, columns, bindNames) {
    if (!outBinds || columns.length === 0) {
        return [];
    }
    const row = {};
    for (let index = 0; index < columns.length; index++) {
        const values = outBinds[bindNames[index]];
        row[columns[index].toUpperCase()] =
            Array.isArray(values) && values.length > 0 ? values[0] : null;
    }
    return [row];
}
`.trim();

function renderInvokeToolPreambleOracle(
    hasAuth: boolean,
    authPipelineTier: AuthPipelineTier,
    stubMaps: HookStubMaps,
    typescript: boolean
): string {
    const accessChecks =
        authPipelineTier === 'none' ? '' : renderInvokeAuthPipeline(authPipelineTier, hasAuth, stubMaps);
    return `
    const toolMeta = generatedTools.find((t) => t.toolName === toolName);
    if (!toolMeta) {
        throw new Error('Unknown tool: ' + toolName);
    }
    loggingAdapter.debug('invokeTool', { toolName });
${renderHostBinding(typescript)}${renderOptionsResolvedInit(authPipelineTier)}${accessChecks}
    const connectionString = resolveConnectionString(host);
    const connection = await oracledb.getConnection(parseOracleConnectInput(connectionString));
    try {
        switch (toolName) {`;
}

function renderInvokeToolPreambleSqlserver(
    hasAuth: boolean,
    authPipelineTier: AuthPipelineTier,
    stubMaps: HookStubMaps,
    typescript: boolean
): string {
    const accessChecks =
        authPipelineTier === 'none' ? '' : renderInvokeAuthPipeline(authPipelineTier, hasAuth, stubMaps);
    return `
    const toolMeta = generatedTools.find((t) => t.toolName === toolName);
    if (!toolMeta) {
        throw new Error('Unknown tool: ' + toolName);
    }
    loggingAdapter.debug('invokeTool', { toolName });
${renderHostBinding(typescript)}${renderOptionsResolvedInit(authPipelineTier)}${accessChecks}
    const connectionString = resolveConnectionString(host);
    const pool = await sql.connect(parseSqlserverConnectInput(connectionString));
    try {
        switch (toolName) {`;
}

function renderOracleInvokeBlockTs(
    toolCases: string,
    flags: InvokeParamHelperFlags,
    hasAuth: boolean,
    authPipelineTier: AuthPipelineTier,
    stubMaps: HookStubMaps,
    hasSqlTools: boolean,
    optionsParam: string
): string {
    const preamble = renderInvokeToolPreambleOracle(hasAuth, authPipelineTier, stubMaps, true);
    const helpers = [
        hasSqlTools ? COMPACT_SQL_FOR_LOG_TS : '',
        flags.oracleNumeric ? ORACLE_NUMERIC_HELPER_TS : '',
        flags.oracleBoolean ? ORACLE_BOOLEAN_HELPER_TS : '',
        flags.oracleDmlReturning ? ORACLE_DML_RETURNING_HELPER_TS : ''
    ]
        .filter((block) => block.length > 0)
        .join('\n\n');
    const helperSection = `\n\n${helpers}`;
    return `
import oracledb from 'oracledb';

function resolveConnectionString(hostContext: DbHostContext): string {
    const cs = hostContext.connectionString?.trim();
    if (cs) {
        return cs;
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}

function parseOracleConnectInput(connectionString: string): { user: string; password: string; connectString: string } {
    const trimmed = connectionString.trim();
    const asHttp = trimmed.replace(/^oracle:\\/\\//i, 'http://');
    const url = new URL(asHttp);
    const serviceName = url.pathname.replace(/^\\//, '');
    if (serviceName.length === 0) {
        throw new Error('Oracle connection URL must include a service name path (e.g. oracle://user:pass@host:1521/FREEPDB1).');
    }
    const port = url.port.length > 0 ? url.port : '1521';
    return {
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        connectString: \`\${url.hostname}:\${port}/\${serviceName}\`
    };
}${helperSection}

export async function invokeTool(
    toolName: string,
    ${optionsParam},
    hostContext?: DbHostContext
): Promise<unknown> {${preamble}
${toolCases}
            default:
                throw new Error('Unknown tool: ' + toolName);
        }
    } finally {
        await connection.close();
    }
}
`.trim();
}

function renderSqlserverInvokeBlockTs(
    toolCases: string,
    flags: InvokeParamHelperFlags,
    hasAuth: boolean,
    authPipelineTier: AuthPipelineTier,
    stubMaps: HookStubMaps,
    hasSqlTools: boolean,
    optionsParam: string
): string {
    const preamble = renderInvokeToolPreambleSqlserver(hasAuth, authPipelineTier, stubMaps, true);
    const helpers = [
        hasSqlTools ? COMPACT_SQL_FOR_LOG_TS : '',
        flags.sqlserverNumeric ? SQLSERVER_NUMERIC_HELPER_TS : '',
        flags.sqlserverBoolean ? SQLSERVER_BOOLEAN_HELPER_TS : ''
    ]
        .filter((block) => block.length > 0)
        .join('\n\n');
    const helperSection = `\n\n${helpers}`;
    return `
import sql from 'mssql';

function resolveConnectionString(hostContext: DbHostContext): string {
    const cs = hostContext.connectionString?.trim();
    if (cs) {
        return cs;
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}

function parseSqlserverConnectInput(connectionString: string): string | Record<string, unknown> {
    const trimmed = connectionString.trim();
    if (/^Server=/i.test(trimmed)) {
        return trimmed;
    }
    const asHttp = trimmed.replace(/^mssql:\\/\\//i, 'http://').replace(/^sqlserver:\\/\\//i, 'http://');
    const url = new URL(asHttp);
    const database = url.pathname.replace(/^\\//, '');
    const encryptParam = url.searchParams.get('encrypt');
    const trustParam = url.searchParams.get('trustServerCertificate');
    return {
        server: url.hostname,
        port: url.port.length > 0 ? Number.parseInt(url.port, 10) : 1433,
        database: database.length > 0 ? database : undefined,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        options: {
            encrypt: encryptParam === 'false' ? false : true,
            trustServerCertificate: trustParam === 'true' || trustParam === '1'
        }
    };
}${helperSection}

export async function invokeTool(
    toolName: string,
    ${optionsParam},
    hostContext?: DbHostContext
): Promise<unknown> {${preamble}
${toolCases}
            default:
                throw new Error('Unknown tool: ' + toolName);
        }
    } finally {
        await pool.close();
    }
}
`.trim();
}

function renderOracleInvokeBlockJs(
    toolCases: string,
    flags: InvokeParamHelperFlags,
    hasAuth: boolean,
    authPipelineTier: AuthPipelineTier,
    stubMaps: HookStubMaps,
    hasSqlTools: boolean,
    optionsParam: string
): string {
    const preamble = renderInvokeToolPreambleOracle(hasAuth, authPipelineTier, stubMaps, false);
    const helpers = [
        hasSqlTools ? COMPACT_SQL_FOR_LOG_JS : '',
        flags.oracleNumeric ? ORACLE_NUMERIC_HELPER_JS : '',
        flags.oracleBoolean ? ORACLE_BOOLEAN_HELPER_JS : '',
        flags.oracleDmlReturning ? ORACLE_DML_RETURNING_HELPER_JS : ''
    ]
        .filter((block) => block.length > 0)
        .join('\n\n');
    const helperSection = `\n\n${helpers}`;
    return `
import oracledb from 'oracledb';

function resolveConnectionString(hostContext) {
    if (hostContext && typeof hostContext === 'object' && hostContext.connectionString != null) {
        const cs = String(hostContext.connectionString).trim();
        if (cs.length > 0) {
            return cs;
        }
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}

function parseOracleConnectInput(connectionString) {
    const trimmed = String(connectionString).trim();
    const asHttp = trimmed.replace(/^oracle:\\/\\//i, 'http://');
    const url = new URL(asHttp);
    const serviceName = url.pathname.replace(/^\\//, '');
    if (serviceName.length === 0) {
        throw new Error('Oracle connection URL must include a service name path (e.g. oracle://user:pass@host:1521/FREEPDB1).');
    }
    const port = url.port.length > 0 ? url.port : '1521';
    return {
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        connectString: url.hostname + ':' + port + '/' + serviceName
    };
}${helperSection}

export async function invokeTool(toolName, ${optionsParam}, hostContext) {${preamble}
${toolCases}
            default:
                throw new Error('Unknown tool: ' + toolName);
        }
    } finally {
        await connection.close();
    }
}
`.trim();
}

function renderSqlserverInvokeBlockJs(
    toolCases: string,
    flags: InvokeParamHelperFlags,
    hasAuth: boolean,
    authPipelineTier: AuthPipelineTier,
    stubMaps: HookStubMaps,
    hasSqlTools: boolean,
    optionsParam: string
): string {
    const preamble = renderInvokeToolPreambleSqlserver(hasAuth, authPipelineTier, stubMaps, false);
    const helpers = [
        hasSqlTools ? COMPACT_SQL_FOR_LOG_JS : '',
        flags.sqlserverNumeric ? SQLSERVER_NUMERIC_HELPER_JS : '',
        flags.sqlserverBoolean ? SQLSERVER_BOOLEAN_HELPER_JS : ''
    ]
        .filter((block) => block.length > 0)
        .join('\n\n');
    const helperSection = `\n\n${helpers}`;
    return `
import sql from 'mssql';

function resolveConnectionString(hostContext) {
    if (hostContext && typeof hostContext === 'object' && hostContext.connectionString != null) {
        const cs = String(hostContext.connectionString).trim();
        if (cs.length > 0) {
            return cs;
        }
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}

function parseSqlserverConnectInput(connectionString) {
    const trimmed = String(connectionString).trim();
    if (/^Server=/i.test(trimmed)) {
        return trimmed;
    }
    const asHttp = trimmed.replace(/^mssql:\\/\\//i, 'http://').replace(/^sqlserver:\\/\\//i, 'http://');
    const url = new URL(asHttp);
    const database = url.pathname.replace(/^\\//, '');
    const encryptParam = url.searchParams.get('encrypt');
    const trustParam = url.searchParams.get('trustServerCertificate');
    return {
        server: url.hostname,
        port: url.port.length > 0 ? Number.parseInt(url.port, 10) : 1433,
        database: database.length > 0 ? database : undefined,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        options: {
            encrypt: encryptParam === 'false' ? false : true,
            trustServerCertificate: trustParam === 'true' || trustParam === '1'
        }
    };
}${helperSection}

export async function invokeTool(toolName, ${optionsParam}, hostContext) {${preamble}
${toolCases}
            default:
                throw new Error('Unknown tool: ' + toolName);
        }
    } finally {
        await pool.close();
    }
}
`.trim();
}

export function renderInvokeBlockTs(
    tools: ResolvedDbToolCodegen[],
    dialect: ResolvedDatabaseDialect,
    hasAuth: boolean,
    authPipelineTier: AuthPipelineTier,
    stubMaps: HookStubMaps
): string {
    const optionsVar = authPipelineTier !== 'none' ? 'optionsResolved' : 'options';
    const toolCases = renderInvokeSwitchCases(tools, dialect, optionsVar);
    const flags = resolveInvokeParamHelperFlags(tools);
    const hasSqlTools = tools.length > 0;
    const optionsParam = renderInvokeOptionsParam(hasSqlTools, authPipelineTier, true);
    if (isMysqlDialect(dialect)) {
        return renderMysqlInvokeBlockTs(
            toolCases,
            flags,
            hasAuth,
            authPipelineTier,
            stubMaps,
            hasSqlTools,
            optionsParam
        );
    }
    if (dialect === 'sqlserver') {
        return renderSqlserverInvokeBlockTs(
            toolCases,
            flags,
            hasAuth,
            authPipelineTier,
            stubMaps,
            hasSqlTools,
            optionsParam
        );
    }
    if (dialect === 'oracle') {
        return renderOracleInvokeBlockTs(
            toolCases,
            flags,
            hasAuth,
            authPipelineTier,
            stubMaps,
            hasSqlTools,
            optionsParam
        );
    }
    return renderPostgresInvokeBlockTs(
        toolCases,
        flags,
        hasAuth,
        authPipelineTier,
        stubMaps,
        hasSqlTools,
        optionsParam
    );
}

export function renderInvokeBlockJs(
    tools: ResolvedDbToolCodegen[],
    dialect: ResolvedDatabaseDialect,
    hasAuth: boolean,
    authPipelineTier: AuthPipelineTier,
    stubMaps: HookStubMaps
): string {
    const optionsVar = authPipelineTier !== 'none' ? 'optionsResolved' : 'options';
    const toolCases = renderInvokeSwitchCases(tools, dialect, optionsVar);
    const flags = resolveInvokeParamHelperFlags(tools);
    const hasSqlTools = tools.length > 0;
    const optionsParam = renderInvokeOptionsParam(hasSqlTools, authPipelineTier, false);
    if (isMysqlDialect(dialect)) {
        return renderMysqlInvokeBlockJs(
            toolCases,
            flags,
            hasAuth,
            authPipelineTier,
            stubMaps,
            hasSqlTools,
            optionsParam
        );
    }
    if (dialect === 'sqlserver') {
        return renderSqlserverInvokeBlockJs(
            toolCases,
            flags,
            hasAuth,
            authPipelineTier,
            stubMaps,
            hasSqlTools,
            optionsParam
        );
    }
    if (dialect === 'oracle') {
        return renderOracleInvokeBlockJs(
            toolCases,
            flags,
            hasAuth,
            authPipelineTier,
            stubMaps,
            hasSqlTools,
            optionsParam
        );
    }
    return renderPostgresInvokeBlockJs(
        toolCases,
        flags,
        hasAuth,
        authPipelineTier,
        stubMaps,
        hasSqlTools,
        optionsParam
    );
}
