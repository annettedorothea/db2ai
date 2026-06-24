import { capSqlLimit } from '../../../utils/sql-limit-validate.js';
export function prepareListCountriesInput(options, credentials) {
    void credentials;
    return capSqlLimit(options);
}
