/**
 * Validate stub for "filmsByMpaaRating" — cap SQL row limit at 100.
 */
import type { InvokeOptions } from '../../../../generated/db2ai/tools/pagila-postgresql-tools.js';
import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';

export function prepareToolCallForFilmsByMpaaRating(options: InvokeOptions, credential: string): InvokeOptions {
    void credential;
    return capSqlMaxRows(options);
}
