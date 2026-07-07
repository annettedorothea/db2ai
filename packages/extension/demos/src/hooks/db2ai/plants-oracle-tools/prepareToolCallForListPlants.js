import { capSqlLimit } from '../../../utils/sql-limit-validate.js';
export function prepareToolCallForListPlants(options) {
    return capSqlLimit(options);
}
