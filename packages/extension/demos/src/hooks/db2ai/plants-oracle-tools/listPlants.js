import { capSqlLimit } from '../../../utils/sql-limit-validate.js';
export function prepareListPlantsInput(options) {
    return capSqlLimit(options);
}
