/**
 * Validate stub for "searchFilms" — cap SQL row limit at 100.
 */
import type { ModuleCredentials } from './verifySakilaMariadbCredentials.js';
import type { InvokeOptions } from '../../../../generated/db2ai/tools/sakila-mariadb-tools.js';
import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';

export function validateSearchFilmsInput(options: InvokeOptions, credentials: ModuleCredentials): InvokeOptions {
    void credentials;
    return capSqlMaxRows(options);
}
