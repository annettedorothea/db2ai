/**
 * Validate stub for "listPlants" — cap SQL row limit at 100.
 */
import type { InvokeOptions } from '../../../../generated/db2ai/tools/plants-oracle-tools.js';
import { capSqlLimit } from '../../../utils/sql-limit-validate.js';

export function prepareListPlantsInput(options: InvokeOptions): InvokeOptions {
    return capSqlLimit(options);
}
