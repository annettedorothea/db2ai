/**
 * Validate stub for "searchPlants" — cap SQL row limit at 100.
 */
import type { ModuleCredentials } from './verifyPlantsOracleCredentials.js';
import type { InvokeOptions } from '../../../../generated/db2ai/tools/plants-oracle-tools.js';
import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';

export function validateSearchPlantsInput(options: InvokeOptions, credentials: ModuleCredentials): InvokeOptions {
    void credentials;
    return capSqlMaxRows(options);
}
