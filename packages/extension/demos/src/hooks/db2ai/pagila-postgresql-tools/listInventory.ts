/**
 * Validate stub for "listInventory" — cap SQL row limit at 100.
 */
import type { InvokeOptions } from '../../../../generated/db2ai/tools/pagila-postgresql-tools.js';
import { capSqlLimit } from '../../../utils/sql-limit-validate.js';

export function prepareToolCallForListInventory(options: InvokeOptions, credential: string): InvokeOptions {
    void credential;
    return capSqlLimit(options);
}
