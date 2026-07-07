/**
 * Validate stub for "searchPlants" — cap SQL row limit at 100.
 */
import type { InvokeOptions } from '../../../../generated/db2ai/tools/plants-oracle-tools.js';
import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';

export function prepareToolCallForSearchPlants(options: InvokeOptions): InvokeOptions {
    return capSqlMaxRows(options);
}
