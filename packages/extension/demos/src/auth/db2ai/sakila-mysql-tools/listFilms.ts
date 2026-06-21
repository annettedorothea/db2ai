/**
 * Validate stub for "listFilms" — cap SQL row limit at 100.
 */
import type { ModuleCredentials } from './verifySakilaMysqlCredentials.js';
import type { InvokeOptions } from '../../../../generated/db2ai/tools/sakila-mysql-tools.js';
import { capSqlLimit } from '../../../utils/sql-limit-validate.js';

export function validateListFilmsInput(options: InvokeOptions, credentials: ModuleCredentials): InvokeOptions {
    void credentials;
    return capSqlLimit(options);
}
