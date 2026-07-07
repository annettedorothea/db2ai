import { capSqlLimit } from '../../../utils/sql-limit-validate.js';
export function prepareToolCallForListCountries(options, credential) {
    void credential;
    return capSqlLimit(options);
}
