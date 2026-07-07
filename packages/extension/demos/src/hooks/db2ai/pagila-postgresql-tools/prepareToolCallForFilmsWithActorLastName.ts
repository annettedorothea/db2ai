/**
 * Validate stub for "filmsWithActorLastName" — cap SQL row limit at 100.
 */
import type { InvokeOptions } from '../../../../generated/db2ai/tools/pagila-postgresql-tools.js';
import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';

export function prepareToolCallForFilmsWithActorLastName(options: InvokeOptions, credential: string): InvokeOptions {
    void credential;
    return capSqlMaxRows(options);
}
