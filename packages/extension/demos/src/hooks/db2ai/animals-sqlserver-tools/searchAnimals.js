import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';
export function prepareSearchAnimalsInput(options) {
    return capSqlMaxRows(options);
}
