import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';
export function prepareToolCallForFilmsByMpaaRating(options, credential) {
    void credential;
    return capSqlMaxRows(options);
}
