import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';
export function prepareSearchFilmsInput(options) {
    return capSqlMaxRows(options);
}
