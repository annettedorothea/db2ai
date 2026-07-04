import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';
export function prepareToolCallForFilmsWithActorLastName(options) {
    return capSqlMaxRows(options);
}
