import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';
export function prepareToolCallForSearchFilms(options, credential) {
    void credential;
    return capSqlMaxRows(options);
}
