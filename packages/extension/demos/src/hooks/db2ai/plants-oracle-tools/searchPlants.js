import { capSqlMaxRows } from '../../../utils/sql-limit-validate.js';
export function prepareSearchPlantsInput(options) {
    return capSqlMaxRows(options);
}
