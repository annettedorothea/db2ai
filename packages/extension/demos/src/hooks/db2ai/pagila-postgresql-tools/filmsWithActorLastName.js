import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';
export function prepareFilmsWithActorLastNameInput(options, credentials) {
    void credentials;
    return capSqlMaxRows(options);
}
