import type { CheckedHostContext, InvokeOptions } from '../../../generated/tools/orders-postgres-tools.js';
import { requireAdmin } from './requireAdmin.js';

export function checkUpdateProductParameters(options: InvokeOptions, host: CheckedHostContext): InvokeOptions {
    requireAdmin(host);
    if (options.productId == null || String(options.productId).trim() === '') {
        throw new Error('updateProduct requires productId.');
    }
    if (options.productName == null || String(options.productName).trim() === '') {
        throw new Error('updateProduct requires productName.');
    }
    if (options.price == null || String(options.price).trim() === '') {
        throw new Error('updateProduct requires price.');
    }
    return options;
}
