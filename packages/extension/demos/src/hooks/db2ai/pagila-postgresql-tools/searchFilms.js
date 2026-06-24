import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';
export function prepareSearchFilmsInput(options, credentials) {
    void credentials;
    return capSqlMaxRows(options);
}
