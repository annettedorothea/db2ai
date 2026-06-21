/**
 * Validate stub for "listFilms" — cap SQL row limit at 100.
 */
import type { ModuleCredentials } from './verifySakilaMariadbCredentials.js';
import type { InvokeOptions } from '../../../../generated/db2ai/tools/sakila-mariadb-tools.js';
import { capSqlLimit } from '../../../utils/sql-limit-validate.js';

export function validateListFilmsInput(options: InvokeOptions, credentials: ModuleCredentials): InvokeOptions {
    void credentials;
    return capSqlLimit(options);
}
