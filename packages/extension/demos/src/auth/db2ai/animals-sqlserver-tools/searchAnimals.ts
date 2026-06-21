/**
 * Validate stub for "searchAnimals" — cap SQL row limit at 100.
 */
import type { ModuleCredentials } from './verifyAnimalsSqlserverCredentials.js';
import type { InvokeOptions } from '../../../../generated/db2ai/tools/animals-sqlserver-tools.js';
import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';

export function validateSearchAnimalsInput(options: InvokeOptions, credentials: ModuleCredentials): InvokeOptions {
    void credentials;
    return capSqlMaxRows(options);
}
