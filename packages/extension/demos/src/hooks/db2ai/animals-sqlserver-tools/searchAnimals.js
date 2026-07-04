import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';
export function prepareToolCallForSearchAnimals(options) {
    return capSqlMaxRows(options);
}
