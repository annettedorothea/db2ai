import { AstUtils, DefaultScopeComputation } from 'langium';
import type { AstNode, LangiumDocument } from 'langium';
import { isSqlParamEntry, isSqlQuery } from './generated/ast.js';

/**
 * Param map keys live under `params`, but `optionalParams` references them from
 * ` prepare: { optionalParams: … }`. Register each SqlParamEntry on its SqlQuery so the
 * default ScopeProvider finds them when resolving optionalParams cross-refs.
 */
export class Db2AiDslScopeComputation extends DefaultScopeComputation {
    protected override addLocalSymbol(
        node: AstNode,
        document: LangiumDocument,
        symbols: Parameters<DefaultScopeComputation['addLocalSymbol']>[2]
    ): void {
        if (isSqlParamEntry(node)) {
            const sqlQuery = AstUtils.getContainerOfType(node, isSqlQuery);
            const name = node.key !== undefined ? String(node.key).trim() : undefined;
            if (sqlQuery && name) {
                symbols.add(sqlQuery, this.descriptions.createDescription(node, name, document));
            }
            return;
        }
        super.addLocalSymbol(node, document, symbols);
    }
}
