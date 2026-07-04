import { capSqlLimit } from '../../../utils/sql-limit-validate.js';
export function prepareToolCallForListActors(options, credential) {
    void credential;
    return capSqlLimit(options);
}
