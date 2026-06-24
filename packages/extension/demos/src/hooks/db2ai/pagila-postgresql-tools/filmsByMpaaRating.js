import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';
export function prepareFilmsByMpaaRatingInput(options, credentials) {
    void credentials;
    return capSqlMaxRows(options);
}
