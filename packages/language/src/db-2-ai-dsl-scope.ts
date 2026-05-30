import { AstUtils, DefaultScopeComputation } from 'langium';
import type { AstNode, LangiumDocument } from 'langium';
import { isSqlParamNameField, isSqlQuery } from './generated/ast.js';

/**
 * Param `name` fields live under `params`, but `optionalParams` references them from
 * `access: checked { … }`. Register each SqlParamNameField on its SqlQuery so the
 * default ScopeProvider finds them when resolving optionalParams cross-refs.
 */
export class Db2AiDslScopeComputation extends DefaultScopeComputation {
    protected override addLocalSymbol(
        node: AstNode,
        document: LangiumDocument,
        symbols: Parameters<DefaultScopeComputation['addLocalSymbol']>[2]
    ): void {
        if (isSqlParamNameField(node)) {
            const sqlQuery = AstUtils.getContainerOfType(node, isSqlQuery);
            const name = this.nameProvider.getName(node);
            if (sqlQuery && name) {
                symbols.add(sqlQuery, this.descriptions.createDescription(node, name, document));
            }
            return;
        }
        super.addLocalSymbol(node, document, symbols);
    }
}
