import { capSqlLimit } from '../../../utils/sql-limit-validate.js';
export function prepareToolCallForListAnimals(options) {
    return capSqlLimit(options);
}
