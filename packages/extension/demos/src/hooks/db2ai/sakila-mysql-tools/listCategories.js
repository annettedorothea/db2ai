import { capSqlLimit } from '../../../utils/sql-limit-validate.js';
export function prepareListCategoriesInput(options) {
    return capSqlLimit(options);
}
