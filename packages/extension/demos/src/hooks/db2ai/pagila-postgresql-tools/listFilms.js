import { capSqlLimit } from '../../../utils/sql-limit-validate.js';
export function prepareToolCallForListFilms(options, credential) {
    void credential;
    return capSqlLimit(options);
}
