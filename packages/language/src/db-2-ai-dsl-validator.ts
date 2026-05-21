import type { ValidationAcceptor, ValidationChecks } from 'langium';
import { CstUtils, isLeafCstNode } from 'langium';
import type { Db2AiDslAstType, Model, Query } from './generated/ast.js';
import type { Db2AiDslServices } from './db-2-ai-dsl-module.js';
import {
    hasTable,
    isPostgresqlConnectionUrl,
    isValidEnvVarName,
    loadSchema,
    resolveDatabaseUrlFromEnvForDocument
} from './schema.js';

const QUERY_BLOCK_KEYS = ['toolName', 'intent', 'example', 'summary', 'maxLimit'] as const;

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
        this.checkQueryRequiredKeys(model, accept);
        this.checkMaxLimit(model, accept);
        this.checkBlockDuplicateKeys(model, accept);
        this.checkUniqueToolNames(model, accept);
        await this.checkTablesExist(model, accept);
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

    private queryBlockHasOpeningBrace(query: Query): boolean {
        const cst = query.$cstNode;
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

    private checkQueryRequiredKeys(model: Model, accept: ValidationAcceptor): void {
        for (const query of model.queries) {
            if (!this.queryBlockHasOpeningBrace(query)) {
                continue;
            }
            if (query.toolName === undefined) {
                accept('error', 'Query requires `toolName: "..."`.', {
                    node: query,
                    property: 'toolName'
                });
            } else if (String(query.toolName).trim().length === 0) {
                accept('error', 'Query `toolName` must not be empty.', {
                    node: query,
                    property: 'toolName'
                });
            }
            if (query.intent === undefined) {
                accept('error', 'Query requires `intent: "..."`.', {
                    node: query,
                    property: 'intent'
                });
            } else if (String(query.intent).trim().length === 0) {
                accept('error', 'Query `intent` must not be empty.', {
                    node: query,
                    property: 'intent'
                });
            }
        }
    }

    private checkMaxLimit(model: Model, accept: ValidationAcceptor): void {
        for (const query of model.queries) {
            if (query.maxLimit === undefined) {
                continue;
            }
            const maxLimit =
                typeof query.maxLimit === 'number' ? query.maxLimit : Number(query.maxLimit);
            if (!Number.isFinite(maxLimit) || maxLimit < 1) {
                accept('error', '`maxLimit` must be a positive integer.', {
                    node: query,
                    property: 'maxLimit'
                });
            }
        }
    }

    private checkBlockDuplicateKeys(model: Model, accept: ValidationAcceptor): void {
        for (const query of model.queries) {
            this.reportDuplicateKeywords(query, accept);
        }
    }

    private reportDuplicateKeywords(query: Query, accept: ValidationAcceptor): void {
        const cst = query.$cstNode;
        if (!cst) {
            return;
        }
        const allowed = new Set<string>(QUERY_BLOCK_KEYS);
        const seen = new Set<string>();
        for (const leaf of CstUtils.flattenCst(cst)) {
            if (!isLeafCstNode(leaf)) {
                continue;
            }
            const text = leaf.text;
            if (!allowed.has(text)) {
                continue;
            }
            if (!seen.has(text)) {
                seen.add(text);
                continue;
            }
            accept('error', `Duplicate key "${text}". Each property may appear at most once per block.`, {
                node: query,
                range: leaf.range
            });
        }
    }

    private checkUniqueToolNames(model: Model, accept: ValidationAcceptor): void {
        const seenToolNames = new Map<string, number>();
        model.queries.forEach((query, index) => {
            const key = query.toolName;
            if (key === undefined || key === null || String(key).trim().length === 0) {
                return;
            }
            const normalized = String(key).trim();
            const firstIndex = seenToolNames.get(normalized);
            if (firstIndex !== undefined) {
                accept('error', `toolName "${normalized}" must be unique.`, {
                    node: model,
                    property: 'queries',
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
                `Environment variable "${String(envName)}" is not set or empty (check examples/.env — value must be on the same line as the key).`,
                { node: model, property: 'env' }
            );
            return;
        }
        if (!isPostgresqlConnectionUrl(connectionUrl)) {
            accept('error', `Environment variable "${String(envName)}" must be a postgresql:// or postgres:// URL.`, {
                node: model,
                property: 'env'
            });
            return;
        }

        let loaded;
        try {
            loaded = await loadSchema(connectionUrl);
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

        model.queries.forEach((query, index) => {
            if (!this.queryBlockHasOpeningBrace(query)) {
                return;
            }
            const tableName = query.table?.name;
            if (tableName === undefined || tableName.trim().length === 0) {
                return;
            }
            if (!hasTable(loaded, tableName)) {
                accept('error', `Table "${tableName}" does not exist in the public schema.`, {
                    node: model,
                    property: 'queries',
                    index
                });
            }
        });
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
