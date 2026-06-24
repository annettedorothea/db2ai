import { capSqlLimit } from '../../../utils/sql-limit-validate.js';
export function prepareListProductsInput(options) {
    return capSqlLimit(options);
}
