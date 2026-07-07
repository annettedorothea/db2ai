import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';
export function prepareToolCallForSearchPlants(options) {
    return capSqlMaxRows(options);
}
