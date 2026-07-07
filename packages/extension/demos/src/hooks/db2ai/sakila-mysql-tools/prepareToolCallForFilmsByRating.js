import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';
export function prepareToolCallForFilmsByRating(options) {
    return capSqlMaxRows(options);
}
