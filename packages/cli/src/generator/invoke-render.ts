import type { ResolvedDatabaseDialect, SqlParamType } from 'db-2-ai-dsl-language';
import type { ResolvedDbToolCodegen, ResolvedSqlToolCodegen } from '../db-query-codegen.js';
import { renderInvokeCredentialAndParameterCheck } from './render-check-stubs.js';

function renderOptionValueExpression(
    propertyName: string,
    dialect: ResolvedDatabaseDialect,
    paramType: SqlParamType,
    optionsVar: string
): string {
    const optionAccess = `${optionsVar}[${JSON.stringify(propertyName)}]`;
    if (dialect === 'mysql') {
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
    if (dialect === 'mysql') {
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

function renderSqlInvokeCase(
    tool: ResolvedSqlToolCodegen,
    dialect: ResolvedDatabaseDialect,
    optionsVar: string
): string {
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
    if (dialect === 'mysql') {
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
};

function resolveInvokeParamHelperFlags(tools: ResolvedDbToolCodegen[]): InvokeParamHelperFlags {
    const flags: InvokeParamHelperFlags = {
        postgresNumeric: false,
        postgresBoolean: false,
        mysqlBoolean: false,
        sqlserverNumeric: false,
        sqlserverBoolean: false
    };
    for (const tool of tools) {
        for (const param of tool.params) {
            if (param.jsonSchemaType === 'integer' || param.jsonSchemaType === 'number') {
                flags.postgresNumeric = true;
                flags.sqlserverNumeric = true;
            }
            if (param.jsonSchemaType === 'boolean') {
                flags.postgresBoolean = true;
                flags.mysqlBoolean = true;
                flags.sqlserverBoolean = true;
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

function renderHostBinding(typescript: boolean): string {
    const guard = `
    if (hostContext === undefined) {
        throw new Error(
            'invokeTool requires hostContext from the MCP host (stdio-mcp-server or http-mcp-server).'
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

function renderInvokeToolPreamble(hasAuth: boolean, hasChecked: boolean, typescript: boolean): string {
    const accessChecks = renderInvokeCredentialAndParameterCheck(hasAuth, hasChecked);
    return `
    const toolMeta = generatedTools.find((t) => t.toolName === toolName);
    if (!toolMeta) {
        throw new Error('Unknown tool: ' + toolName);
    }
    loggingAdapter.debug('invokeTool', { toolName });
${renderHostBinding(typescript)}${accessChecks}${renderPostgresClientSetup(typescript)}
    try {
        switch (toolName) {`;
}

function renderInvokeToolPreambleMysql(hasAuth: boolean, hasChecked: boolean, typescript: boolean): string {
    const accessChecks = renderInvokeCredentialAndParameterCheck(hasAuth, hasChecked);
    return `
    const toolMeta = generatedTools.find((t) => t.toolName === toolName);
    if (!toolMeta) {
        throw new Error('Unknown tool: ' + toolName);
    }
    loggingAdapter.debug('invokeTool', { toolName });
${renderHostBinding(typescript)}${accessChecks}
    const connectionString = resolveConnectionString(host);
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
    hasChecked: boolean
): string {
    const preamble = renderInvokeToolPreamble(hasAuth, hasChecked, true);
    const helpers = [
        COMPACT_SQL_FOR_LOG_TS,
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
    options: InvokeOptions = {},
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
    hasChecked: boolean
): string {
    const preamble = renderInvokeToolPreamble(hasAuth, hasChecked, false);
    const helpers = [
        COMPACT_SQL_FOR_LOG_JS,
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

export async function invokeTool(toolName, options = {}, hostContext) {${preamble}
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
    hasChecked: boolean
): string {
    const preamble = renderInvokeToolPreambleMysql(hasAuth, hasChecked, true);
    const mysqlHelpers = [COMPACT_SQL_FOR_LOG_TS, flags.mysqlBoolean ? MYSQL_BOOLEAN_HELPER_TS : '']
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
}${helperSection}

export async function invokeTool(
    toolName: string,
    options: InvokeOptions = {},
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
    hasChecked: boolean
): string {
    const preamble = renderInvokeToolPreambleMysql(hasAuth, hasChecked, false);
    const mysqlHelpers = [COMPACT_SQL_FOR_LOG_JS, flags.mysqlBoolean ? MYSQL_BOOLEAN_HELPER_JS : '']
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
}${helperSection}

export async function invokeTool(toolName, options = {}, hostContext) {${preamble}
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

function renderInvokeToolPreambleSqlserver(hasAuth: boolean, hasChecked: boolean, typescript: boolean): string {
    const accessChecks = renderInvokeCredentialAndParameterCheck(hasAuth, hasChecked);
    return `
    const toolMeta = generatedTools.find((t) => t.toolName === toolName);
    if (!toolMeta) {
        throw new Error('Unknown tool: ' + toolName);
    }
    loggingAdapter.debug('invokeTool', { toolName });
${renderHostBinding(typescript)}${accessChecks}
    const connectionString = resolveConnectionString(host);
    const pool = await sql.connect(parseSqlserverConnectInput(connectionString));
    try {
        switch (toolName) {`;
}

function renderSqlserverInvokeBlockTs(
    toolCases: string,
    flags: InvokeParamHelperFlags,
    hasAuth: boolean,
    hasChecked: boolean
): string {
    const preamble = renderInvokeToolPreambleSqlserver(hasAuth, hasChecked, true);
    const helpers = [
        COMPACT_SQL_FOR_LOG_TS,
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
    options: InvokeOptions = {},
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

function renderSqlserverInvokeBlockJs(
    toolCases: string,
    flags: InvokeParamHelperFlags,
    hasAuth: boolean,
    hasChecked: boolean
): string {
    const preamble = renderInvokeToolPreambleSqlserver(hasAuth, hasChecked, false);
    const helpers = [
        COMPACT_SQL_FOR_LOG_JS,
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

export async function invokeTool(toolName, options = {}, hostContext) {${preamble}
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
    hasChecked: boolean
): string {
    const optionsVar = hasChecked ? 'optionsResolved' : 'options';
    const toolCases = renderInvokeSwitchCases(tools, dialect, optionsVar);
    const flags = resolveInvokeParamHelperFlags(tools);
    if (dialect === 'mysql') {
        return renderMysqlInvokeBlockTs(toolCases, flags, hasAuth, hasChecked);
    }
    if (dialect === 'sqlserver') {
        return renderSqlserverInvokeBlockTs(toolCases, flags, hasAuth, hasChecked);
    }
    return renderPostgresInvokeBlockTs(toolCases, flags, hasAuth, hasChecked);
}

export function renderInvokeBlockJs(
    tools: ResolvedDbToolCodegen[],
    dialect: ResolvedDatabaseDialect,
    hasAuth: boolean,
    hasChecked: boolean
): string {
    const optionsVar = hasChecked ? 'optionsResolved' : 'options';
    const toolCases = renderInvokeSwitchCases(tools, dialect, optionsVar);
    const flags = resolveInvokeParamHelperFlags(tools);
    if (dialect === 'mysql') {
        return renderMysqlInvokeBlockJs(toolCases, flags, hasAuth, hasChecked);
    }
    if (dialect === 'sqlserver') {
        return renderSqlserverInvokeBlockJs(toolCases, flags, hasAuth, hasChecked);
    }
    return renderPostgresInvokeBlockJs(toolCases, flags, hasAuth, hasChecked);
}
