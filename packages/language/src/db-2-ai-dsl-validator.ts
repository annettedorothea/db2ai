import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { Db2AiDslAstType, Model } from './generated/ast.js';
import { isSqlQuery } from './generated/ast.js';
import type { Db2AiDslServices } from './db-2-ai-dsl-module.js';
import { checkSqlQuery } from './db-2-ai-dsl-sql-validator.js';
import {
    databaseDialectDisplayName,
    databaseDialectFromModel,
    expectedConnectionUrlDescription,
    isSupportedConnectionUrlForDialect
} from './dialect.js';
import { isValidEnvVarName, resolveDatabaseUrlFromEnvForDocument } from './schema.js';

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
        this.checkUniqueToolNames(model, accept);
        this.checkConnectionUrlDialect(model, accept);
        for (const entry of model.entries) {
            if (isSqlQuery(entry)) {
                checkSqlQuery(entry, accept);
            }
        }
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

    private checkConnectionUrlDialect(model: Model, accept: ValidationAcceptor): void {
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
}
