import { capSqlLimit } from '../../../utils/sql-limit-validate.js';
export function prepareListProductsWithReviewsInput(options, credentials) {
    void credentials;
    return capSqlLimit(options);
}
