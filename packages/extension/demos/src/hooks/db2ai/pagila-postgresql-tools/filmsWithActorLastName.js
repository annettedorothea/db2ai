import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';
export function prepareToolCallForFilmsWithActorLastName(options, credential) {
    void credential;
    return capSqlMaxRows(options);
}
