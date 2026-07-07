import { capSqlLimit } from '../../../utils/sql-limit-validate.js';
export function prepareToolCallForListCategories(options, credential) {
    void credential;
    return capSqlLimit(options);
}
