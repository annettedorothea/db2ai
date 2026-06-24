import { capSqlLimit } from '../../../utils/sql-limit-validate.js';
export function prepareListFilmsInput(options, credentials) {
    void credentials;
    return capSqlLimit(options);
}
