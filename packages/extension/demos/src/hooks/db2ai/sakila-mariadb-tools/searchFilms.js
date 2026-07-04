import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';
export function prepareToolCallForSearchFilms(options) {
    return capSqlMaxRows(options);
}
