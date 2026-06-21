/**
 * Validate stub for "searchFilms" — cap SQL row limit at 100.
 */
import type { ModuleCredentials } from './verifySakilaMysqlCredentials.js';
import type { InvokeOptions } from '../../../../generated/db2ai/tools/sakila-mysql-tools.js';
import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';

export function validateSearchFilmsInput(options: InvokeOptions, credentials: ModuleCredentials): InvokeOptions {
    void credentials;
    return capSqlMaxRows(options);
}
