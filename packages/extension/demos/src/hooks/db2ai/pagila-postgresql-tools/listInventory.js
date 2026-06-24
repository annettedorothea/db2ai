import { capSqlLimit } from '../../../utils/sql-limit-validate.js';
export function prepareListInventoryInput(options, credentials) {
    void credentials;
    return capSqlLimit(options);
}
