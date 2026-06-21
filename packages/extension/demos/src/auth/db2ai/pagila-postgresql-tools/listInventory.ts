/**
 * Validate stub for "listInventory" — cap SQL row limit at 100.
 */
import type { ModuleCredentials } from './verifyPagilaPostgresqlCredentials.js';
import type { InvokeOptions } from '../../../../generated/db2ai/tools/pagila-postgresql-tools.js';
import { capSqlLimit } from '../../../utils/sql-limit-validate.js';

export function validateListInventoryInput(options: InvokeOptions, credentials: ModuleCredentials): InvokeOptions {
    void credentials;
    return capSqlLimit(options);
}
