import {TSESTree} from "@typescript-eslint/experimental-utils";
import {isCommaToken} from "@typescript-eslint/experimental-utils/dist/ast-utils";
import {
    RuleFixer,
    SourceCode,
} from "@typescript-eslint/experimental-utils/dist/ts-eslint";

export function appendImport(
    fixer: RuleFixer,
    node: TSESTree.ImportDeclaration,
    text: string,
    sourceCode: Readonly<SourceCode>
) {
    const lastSpecifier = node.specifiers[node.specifiers.length - 1];
    const [lastToken] = sourceCode.getLastTokens(lastSpecifier, 1);
    text = isCommaToken(lastToken) ? ` ${text},` : `, ${text}`;
    return fixer.insertTextAfter(lastToken || lastSpecifier, text);
}
