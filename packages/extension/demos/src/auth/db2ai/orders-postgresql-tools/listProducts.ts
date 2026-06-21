/**
 * Validate stub for "listProducts" — cap SQL row limit at 100.
 */
import type { ModuleCredentials } from './verifyOrdersPostgresqlCredentials.js';
import type { InvokeOptions } from '../../../../generated/db2ai/tools/orders-postgresql-tools.js';
import { capSqlLimit } from '../../../utils/sql-limit-validate.js';

export function validateListProductsInput(options: InvokeOptions, credentials: ModuleCredentials): InvokeOptions {
    void credentials;
    return capSqlLimit(options);
}
