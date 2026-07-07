/**
 * Validate stub for "listFilms" — cap SQL row limit at 100.
 */
import type { InvokeOptions } from '../../../../generated/db2ai/tools/sakila-mysql-tools.js';
import { capSqlLimit } from '../../../utils/sql-limit-validate.js';

export function prepareToolCallForListFilms(options: InvokeOptions): InvokeOptions {
    return capSqlLimit(options);
}
