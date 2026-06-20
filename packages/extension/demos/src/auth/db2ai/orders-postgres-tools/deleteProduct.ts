import type { CheckedHostContext, InvokeOptions } from '../../../../generated/db2ai/tools/orders-postgres-tools.js';
import { requireAdmin } from './requireAdmin.js';

export function checkDeleteProductParameters(options: InvokeOptions, host: CheckedHostContext): InvokeOptions {
    requireAdmin(host);
    if (options.productId == null || String(options.productId).trim() === '') {
        throw new Error('deleteProduct requires productId.');
    }
    return options;
}
