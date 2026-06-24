import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';
export function prepareFilmsByRatingInput(options) {
    return capSqlMaxRows(options);
}
