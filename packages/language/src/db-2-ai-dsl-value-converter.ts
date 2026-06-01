import { DefaultValueConverter, isLeafCstNode, type ValueType } from 'langium';
import type { CstNode } from 'langium';

export class Db2AiDslValueConverter extends DefaultValueConverter {
    override convert(input: string, cstNode: CstNode): ValueType {
        if (isLeafCstNode(cstNode) && cstNode.tokenType.name === 'MULTILINE_STRING') {
            return stripMultilineStringQuotes(input);
        }
        return super.convert(input, cstNode);
    }
}

function stripMultilineStringQuotes(input: string): string {
    if (input.startsWith("'''")) {
        return input.slice(3, -3);
    }
    if (input.startsWith('"""')) {
        return input.slice(3, -3);
    }
    return input;
}
