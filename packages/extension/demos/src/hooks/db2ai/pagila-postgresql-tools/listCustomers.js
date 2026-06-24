import { capSqlLimit } from '../../../utils/sql-limit-validate.js';
export function prepareListCustomersInput(options, credentials) {
    void credentials;
    return capSqlLimit(options);
}
