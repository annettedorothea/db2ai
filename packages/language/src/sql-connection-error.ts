import type { ResolvedDatabaseDialect } from './dialect.js';

const GENERIC_CONNECTION_CODES = new Set([
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EHOSTUNREACH',
    'ESOCKET',
    'ECONNRESET'
]);

const UNREACHABLE_MESSAGE_PATTERNS = [
    /connection refused/i,
    /connect timeout/i,
    /connection timeout/i,
    /failed to connect/i,
    /connectionerror/i,
    /getaddrinfo/i,
    /could not connect/i,
    /login failed/i,
    /password authentication failed/i
];

const UNREACHABLE_ORACLE_PATTERNS = [
    /ORA-12541/i,
    /ORA-12170/i,
    /ORA-12514/i,
    /ORA-01017/i,
    /NJS-503/i,
    /NJS-500/i,
    /NJS-518/i,
    /cannot connect to Oracle Database/i,
    /not registered with the listener/i
];

const SQL_ERROR_ORACLE_PATTERNS = [/ORA-009\d/i, /ORA-00942/i];

function errorMessage(err: unknown): string {
    if (err instanceof Error) {
        return err.message;
    }
    return String(err);
}

function errorCode(err: unknown): string | undefined {
    if (err !== null && typeof err === 'object' && 'code' in err) {
        const code = (err as { code?: unknown }).code;
        return typeof code === 'string' ? code : undefined;
    }
    return undefined;
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
    return patterns.some((pattern) => pattern.test(text));
}

/** Short reason for env-level diagnostic (first line / code). */
export function formatDatabaseUnreachableReason(err: unknown): string {
    const code = errorCode(err);
    const message = errorMessage(err).trim();
    if (code !== undefined && message.length > 0) {
        const firstLine = message.split('\n')[0]?.trim() ?? message;
        if (firstLine.includes(code)) {
            return firstLine;
        }
        return `${code}: ${firstLine}`;
    }
    if (code !== undefined) {
        return code;
    }
    return message.split('\n')[0]?.trim() ?? 'connection failed';
}

/**
 * True when live SQL validation cannot run because the database is unreachable
 * (network, listener, auth). Syntax/schema errors return false.
 */
export function isDatabaseUnreachableError(err: unknown, _dialect: ResolvedDatabaseDialect): boolean {
    const code = errorCode(err);
    if (code !== undefined && GENERIC_CONNECTION_CODES.has(code)) {
        return true;
    }

    const message = errorMessage(err);
    if (matchesAny(message, SQL_ERROR_ORACLE_PATTERNS) || /incorrect syntax/i.test(message)) {
        return false;
    }
    if (matchesAny(message, UNREACHABLE_ORACLE_PATTERNS)) {
        return true;
    }
    if (matchesAny(message, UNREACHABLE_MESSAGE_PATTERNS)) {
        return true;
    }

    return false;
}
