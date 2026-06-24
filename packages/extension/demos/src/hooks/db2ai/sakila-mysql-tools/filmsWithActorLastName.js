import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';
export function prepareFilmsWithActorLastNameInput(options) {
    return capSqlMaxRows(options);
}
