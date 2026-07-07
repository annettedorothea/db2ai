/**
 * Validate stub for "listActors" — cap SQL row limit at 100.
 */
import type { InvokeOptions } from '../../../../generated/db2ai/tools/pagila-postgresql-tools.js';
import { capSqlLimit } from '../../../utils/sql-limit-validate.js';

export function prepareToolCallForListActors(options: InvokeOptions, credential: string): InvokeOptions {
    void credential;
    return capSqlLimit(options);
}
