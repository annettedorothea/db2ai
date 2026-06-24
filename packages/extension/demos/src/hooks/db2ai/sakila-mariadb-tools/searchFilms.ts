/**
 * Validate stub for "searchFilms" — cap SQL row limit at 100.
 */
import type { InvokeOptions } from '../../../../generated/db2ai/tools/sakila-mariadb-tools.js';
import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';

export function prepareSearchFilmsInput(options: InvokeOptions): InvokeOptions {
    return capSqlMaxRows(options);
}
