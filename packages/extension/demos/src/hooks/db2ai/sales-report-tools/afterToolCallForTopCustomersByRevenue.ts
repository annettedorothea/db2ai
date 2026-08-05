import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { InvokeOptions } from '../../../../generated/db2ai/tools/sales-report-tools.js';

type SqlResult = {
    rows: Record<string, unknown>[];
    rowCount: number;
};

function isSqlResult(value: unknown): value is SqlResult {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const v = value as Record<string, unknown>;
    return Array.isArray(v.rows) && typeof v.rowCount === 'number';
}

function csvEscape(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }
    const text = String(value);
    if (/[",\r\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function rowsToCsv(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) {
        return '';
    }
    const columns = Object.keys(rows[0]!);
    const lines = [columns.map(csvEscape).join(',')];
    for (const row of rows) {
        lines.push(columns.map((col) => csvEscape(row[col])).join(','));
    }
    return `${lines.join('\n')}\n`;
}

/**
 * afterToolCall for topCustomersByRevenue — write CSV to OS temp and return path metadata.
 */
export function afterToolCallForTopCustomersByRevenue(result: unknown, options: InvokeOptions): unknown {
    void options;
    if (!isSqlResult(result)) {
        throw new Error('afterToolCallForTopCustomersByRevenue expected { rows, rowCount } from SQL invoke');
    }
    const dir = path.join(os.tmpdir(), 'toolfactory-sales-exports');
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = 'top-customers-by-revenue.csv';
    const filePath = path.join(dir, `${stamp}-${filename}`);
    const csv = rowsToCsv(result.rows);
    fs.writeFileSync(filePath, csv, 'utf8');
    return {
        kind: 'csv',
        contentType: 'text/csv',
        filename,
        rowCount: result.rowCount,
        byteLength: Buffer.byteLength(csv, 'utf8'),
        path: filePath,
        saved: true
    };
}
