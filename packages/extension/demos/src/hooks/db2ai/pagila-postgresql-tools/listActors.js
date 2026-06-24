import { capSqlLimit } from '../../../utils/sql-limit-validate.js';
export function prepareListActorsInput(options, credentials) {
    void credentials;
    return capSqlLimit(options);
}
