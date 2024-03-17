import {TSESTree} from "@typescript-eslint/utils";
import {isCommaToken} from "@typescript-eslint/utils/ast-utils";
import {RuleFixer, SourceCode} from "@typescript-eslint/utils/ts-eslint";

export function appendArgument(
    fixer: RuleFixer,
    node: TSESTree.CallExpression,
    text: string,
    sourceCode: Readonly<SourceCode>
) {
    const [penultimateToken, lastToken] = sourceCode.getLastTokens(node, 2);
    if (node.arguments.length > 0) {
        text = isCommaToken(penultimateToken) ? ` ${text},` : `, ${text}`;
    }

    return fixer.insertTextBefore(lastToken, text);
}
