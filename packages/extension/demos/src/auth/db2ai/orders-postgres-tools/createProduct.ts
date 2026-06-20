import type { CheckedHostContext, InvokeOptions } from '../../../../generated/db2ai/tools/orders-postgres-tools.js';
import { requireAdmin } from './requireAdmin.js';

export function checkCreateProductParameters(options: InvokeOptions, host: CheckedHostContext): InvokeOptions {
    requireAdmin(host);
    if (options.productName == null || String(options.productName).trim() === '') {
        throw new Error('createProduct requires productName.');
    }
    if (options.price == null || String(options.price).trim() === '') {
        throw new Error('createProduct requires price.');
    }
    return options;
}
