/**
 * Validate stub for "filmsWithActorLastName" — cap SQL row limit at 100.
 */
import type { ModuleCredentials } from './verifyPagilaPostgresqlCredentials.js';
import type { InvokeOptions } from '../../../../generated/db2ai/tools/pagila-postgresql-tools.js';
import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';

export function prepareFilmsWithActorLastNameInput(
    options: InvokeOptions,
    credentials?: ModuleCredentials
): InvokeOptions {
    void credentials;
    return capSqlMaxRows(options);
}
