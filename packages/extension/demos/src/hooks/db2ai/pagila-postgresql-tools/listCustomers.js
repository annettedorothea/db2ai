import { capSqlLimit } from '../../../utils/sql-limit-validate.js';
export function prepareToolCallForListCustomers(options, credential) {
    void credential;
    return capSqlLimit(options);
}
