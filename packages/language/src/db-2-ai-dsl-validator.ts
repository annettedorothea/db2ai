import type { ValidationAcceptor, ValidationChecks } from 'langium';
import { CstUtils, isLeafCstNode } from 'langium';
import type { Db2AiDslAstType, Model } from './generated/ast.js';
import { isSqlQuery, isTableQuery } from './generated/ast.js';
import type { Db2AiDslServices } from './db-2-ai-dsl-module.js';
import { checkSqlQuery } from './db-2-ai-dsl-sql-validator.js';
import {
    databaseDialectDisplayName,
    databaseDialectFromModel,
    databaseSchemaDescription,
    expectedConnectionUrlDescription,
    isSupportedConnectionUrlForDialect
} from './dialect.js';
import { hasColumn, hasTable, isValidEnvVarName, loadSchema, resolveDatabaseUrlFromEnvForDocument } from './schema.js';

export const DEFAULT_MAX_LIMIT_CAP = 1000;
export const DEFAULT_PAGE_LIMIT = 100;

export function registerValidationChecks(services: Db2AiDslServices): void {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.Db2AiDslValidator;
    const checks: ValidationChecks<Db2AiDslAstType> = {
        Model: validator.checkModel
    };
    registry.register(checks, validator);
}

export class Db2AiDslValidator {
    async checkModel(model: Model, accept: ValidationAcceptor): Promise<void> {
        this.checkDatabaseEnv(model, accept);
        this.checkRequiredKeys(model, accept);
        this.checkMaxLimit(model, accept);
        this.checkColumnMapDuplicateKeys(model, accept);
        this.checkUniqueToolNames(model, accept);
        await this.checkTablesExist(model, accept);
        await this.checkColumnKeysExist(model, accept);
    }

    private checkDatabaseEnv(model: Model, accept: ValidationAcceptor): void {
        const env = model.env;
        if (env === undefined || env === null || String(env).trim().length === 0) {
            accept('error', 'Model requires `database env "ENV_VAR_NAME"`.', {
                node: model,
                property: 'env'
            });
            return;
        }
        if (!isValidEnvVarName(String(env))) {
            accept('error', 'database env must be a valid environment variable name (e.g. PAGILA_DATABASE_URL).', {
                node: model,
                property: 'env'
            });
        }
    }

    private blockHasOpeningBrace(cst: Model['entries'][number]['$cstNode']): boolean {
        if (!cst) {
            return false;
        }
        for (const leaf of CstUtils.flattenCst(cst)) {
            if (isLeafCstNode(leaf) && leaf.text === '{') {
                return true;
            }
        }
        return false;
    }

    private checkRequiredKeys(model: Model, accept: ValidationAcceptor): void {
        for (const entry of model.entries) {
            if (isSqlQuery(entry)) {
                checkSqlQuery(entry, accept);
                continue;
            }
            if (!isTableQuery(entry)) {
                continue;
            }
            if (!this.blockHasOpeningBrace(entry.$cstNode)) {
                continue;
            }
            if (entry.toolName === undefined) {
                accept('error', 'Query requires `toolName: "..."`.', {
                    node: entry,
                    property: 'toolName'
                });
            } else if (String(entry.toolName).trim().length === 0) {
                accept('error', 'Query `toolName` must not be empty.', {
                    node: entry,
                    property: 'toolName'
                });
            }
            if (entry.intent === undefined) {
                accept('error', 'Query requires `intent: "..."`.', {
                    node: entry,
                    property: 'intent'
                });
            } else if (String(entry.intent).trim().length === 0) {
                accept('error', 'Query `intent` must not be empty.', {
                    node: entry,
                    property: 'intent'
                });
            }
        }
    }

    private checkMaxLimit(model: Model, accept: ValidationAcceptor): void {
        for (const entry of model.entries) {
            if (!isTableQuery(entry) || entry.maxLimit === undefined) {
                continue;
            }
            const maxLimit = typeof entry.maxLimit === 'number' ? entry.maxLimit : Number(entry.maxLimit);
            if (!Number.isFinite(maxLimit) || maxLimit < 1) {
                accept('error', '`maxLimit` must be a positive integer.', {
                    node: entry,
                    property: 'maxLimit'
                });
            }
        }
    }

    private checkColumnMapDuplicateKeys(model: Model, accept: ValidationAcceptor): void {
        for (const entry of model.entries) {
            if (!isTableQuery(entry)) {
                continue;
            }
            const entries = entry.columns?.entries;
            if (!entries || entries.length === 0) {
                continue;
            }
            const seen = new Set<string>();
            for (const col of entries) {
                const name = col.name;
                if (name === undefined || name.trim().length === 0) {
                    continue;
                }
                if (seen.has(name)) {
                    accept('error', `Duplicate column key "${name}". Each column may appear at most once.`, {
                        node: col,
                        property: 'name'
                    });
                    continue;
                }
                seen.add(name);
            }
        }
    }

    private checkUniqueToolNames(model: Model, accept: ValidationAcceptor): void {
        const seenToolNames = new Map<string, number>();
        model.entries.forEach((entry, index) => {
            const key = entry.toolName;
            if (key === undefined || key === null || String(key).trim().length === 0) {
                return;
            }
            const normalized = String(key).trim();
            const firstIndex = seenToolNames.get(normalized);
            if (firstIndex !== undefined) {
                accept('error', `toolName "${normalized}" must be unique.`, {
                    node: model,
                    property: 'entries',
                    index
                });
                return;
            }
            seenToolNames.set(normalized, index);
        });
    }

    private async checkTablesExist(model: Model, accept: ValidationAcceptor): Promise<void> {
        const envName = model.env;
        if (envName === undefined || envName === null || String(envName).trim().length === 0) {
            return;
        }
        if (!isValidEnvVarName(String(envName))) {
            return;
        }

        const documentUri = model.$document?.uri.toString();
        const connectionUrl = resolveDatabaseUrlFromEnvForDocument(String(envName), documentUri);
        if (connectionUrl === undefined) {
            accept(
                'warning',
                `Environment variable "${String(envName)}" is not set or empty (check .env in your workspace — value must be on the same line as the key).`,
                { node: model, property: 'env' }
            );
            return;
        }
        const dialect = databaseDialectFromModel(model);
        if (!isSupportedConnectionUrlForDialect(dialect, connectionUrl)) {
            accept(
                'error',
                `Environment variable "${String(envName)}" must be a ${expectedConnectionUrlDescription(dialect)} for ${databaseDialectDisplayName(dialect)}.`,
                {
                    node: model,
                    property: 'env'
                }
            );
            return;
        }

        let loaded;
        try {
            loaded = await loadSchema(connectionUrl, dialect);
        } catch (error) {
            accept(
                'warning',
                `Cannot load database schema (${String(envName)}): ${this.getErrorMessage(error)}. Table names are not verified.`,
                {
                    node: model,
                    property: 'env'
                }
            );
            return;
        }

        model.entries.forEach((entry, index) => {
            if (!isTableQuery(entry) || !this.blockHasOpeningBrace(entry.$cstNode)) {
                return;
            }
            const tableName = entry.table?.name;
            if (tableName === undefined || tableName.trim().length === 0) {
                return;
            }
            if (!hasTable(loaded, tableName)) {
                accept('error', `Table "${tableName}" does not exist in the ${databaseSchemaDescription(dialect)}.`, {
                    node: model,
                    property: 'entries',
                    index
                });
            }
        });
    }

    private async checkColumnKeysExist(model: Model, accept: ValidationAcceptor): Promise<void> {
        const envName = model.env;
        if (envName === undefined || envName === null || String(envName).trim().length === 0) {
            return;
        }
        if (!isValidEnvVarName(String(envName))) {
            return;
        }

        const documentUri = model.$document?.uri.toString();
        const connectionUrl = resolveDatabaseUrlFromEnvForDocument(String(envName), documentUri);
        const dialect = databaseDialectFromModel(model);
        if (connectionUrl === undefined || !isSupportedConnectionUrlForDialect(dialect, connectionUrl)) {
            return;
        }

        let loaded;
        try {
            loaded = await loadSchema(connectionUrl, dialect);
        } catch {
            return;
        }

        for (const entry of model.entries) {
            if (!isTableQuery(entry) || !this.blockHasOpeningBrace(entry.$cstNode)) {
                continue;
            }
            const colEntries = entry.columns?.entries;
            if (!colEntries || colEntries.length === 0) {
                continue;
            }
            const tableName = entry.table?.name;
            if (tableName === undefined || tableName.trim().length === 0) {
                continue;
            }
            if (!hasTable(loaded, tableName)) {
                continue;
            }
            for (const col of colEntries) {
                const columnName = col.name;
                if (columnName === undefined || columnName.trim().length === 0) {
                    continue;
                }
                if (!hasColumn(loaded, tableName, columnName)) {
                    accept(
                        'error',
                        `Column "${columnName}" does not exist on table "${tableName}" in the ${databaseSchemaDescription(dialect)}.`,
                        {
                            node: col,
                            property: 'name'
                        }
                    );
                }
            }
        }
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
