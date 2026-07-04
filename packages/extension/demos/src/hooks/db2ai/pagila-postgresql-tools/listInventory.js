import { capSqlLimit } from '../../../utils/sql-limit-validate.js';
export function prepareToolCallForListInventory(options, credential) {
    void credential;
    return capSqlLimit(options);
}
