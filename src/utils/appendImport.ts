import {TSESTree} from "@typescript-eslint/utils";
import {isCommaToken} from "@typescript-eslint/utils/ast-utils";
import {RuleFixer, SourceCode} from "@typescript-eslint/utils/ts-eslint";

export function appendImport(
    fixer: RuleFixer,
    node: TSESTree.ImportDeclaration,
    text: string,
    sourceCode: Readonly<SourceCode>
) {
    const lastSpecifier = node.specifiers.at(-1);
    const [lastToken] = sourceCode.getLastTokens(lastSpecifier!, 1);
    text = isCommaToken(lastToken) ? ` ${text},` : `, ${text}`;
    return fixer.insertTextAfter(lastToken || lastSpecifier, text);
}
