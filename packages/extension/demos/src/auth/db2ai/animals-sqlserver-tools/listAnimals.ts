/**
 * Validate stub for "listAnimals" — cap SQL row limit at 100.
 */
import type { ModuleCredentials } from './verifyAnimalsSqlserverCredentials.js';
import type { InvokeOptions } from '../../../../generated/db2ai/tools/animals-sqlserver-tools.js';
import { capSqlLimit } from '../../../utils/sql-limit-validate.js';

export function validateListAnimalsInput(options: InvokeOptions, credentials: ModuleCredentials): InvokeOptions {
    void credentials;
    return capSqlLimit(options);
}
