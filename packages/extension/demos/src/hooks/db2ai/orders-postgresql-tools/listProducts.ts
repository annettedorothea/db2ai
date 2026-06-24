/**
 * Validate stub for "listProducts" — cap SQL row limit at 100.
 */
import type { InvokeOptions } from '../../../../generated/db2ai/tools/orders-postgresql-tools.js';
import { capSqlLimit } from '../../../utils/sql-limit-validate.js';

export function prepareListProductsInput(options: InvokeOptions): InvokeOptions {
    return capSqlLimit(options);
}
