/**
 * Validate stub for "filmsByRating" — cap SQL row limit at 100.
 */
import type { InvokeOptions } from '../../../../generated/db2ai/tools/sakila-mysql-tools.js';
import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';

export function prepareFilmsByRatingInput(options: InvokeOptions): InvokeOptions {
    return capSqlMaxRows(options);
}
