/**
 * Validate stub for "searchAnimals" — cap SQL row limit at 100.
 */
import type { InvokeOptions } from '../../../../generated/db2ai/tools/animals-sqlserver-tools.js';
import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';

export function prepareSearchAnimalsInput(options: InvokeOptions): InvokeOptions {
    return capSqlMaxRows(options);
}
