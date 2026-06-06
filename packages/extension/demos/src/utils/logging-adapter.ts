/**
 * Logging adapter (write-once — customize this file; re-generate does not overwrite).
 * Default: stderr with ANSI colors. debug() only when process.env.LOG_LEVEL === 'debug'.
 * Optional prefix: process.env.LOG_SERVICE_PREFIX (set by init / demo npm scripts).
 */
const GRAY = '\x1b[90m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';

function servicePrefix(): string {
    const raw = process.env.LOG_SERVICE_PREFIX?.trim();
    return raw && raw.length > 0 ? '[' + raw + '] ' : '';
}

function formatLine(level: string, color: string, message: string, context?: object): string {
    const suffix = context !== undefined && Object.keys(context).length > 0 ? ' ' + JSON.stringify(context) : '';
    return color + '[' + level + '] ' + servicePrefix() + message + suffix + RESET;
}

export class LoggingAdapter {
    debug(message: string, context?: object): void {
        if (process.env.LOG_LEVEL !== 'debug') {
            return;
        }
        console.error(formatLine('debug', GRAY, message, context));
    }

    info(message: string, context?: object): void {
        console.error(formatLine('info', RESET, message, context));
    }

    warn(message: string, context?: object): void {
        console.error(formatLine('warn', YELLOW, message, context));
    }

    error(message: string, context?: object): void {
        console.error(formatLine('error', RED, message, context));
    }
}

export const loggingAdapter = new LoggingAdapter();
