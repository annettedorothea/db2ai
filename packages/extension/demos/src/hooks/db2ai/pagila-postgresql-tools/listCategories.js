import { capSqlLimit } from '../../../utils/sql-limit-validate.js';
export function prepareListCategoriesInput(options, credentials) {
    void credentials;
    return capSqlLimit(options);
}
