import {TSESTree} from "@typescript-eslint/utils";
import {RuleFixer, SourceCode} from "@typescript-eslint/utils/ts-eslint";
import {getParenthesizedRange} from "./parentheses";

export function replaceArgument(
    fixer: RuleFixer,
    node: TSESTree.Node,
    text: string,
    sourceCode: Readonly<SourceCode>
) {
    return fixer.replaceTextRange(
        getParenthesizedRange(node, sourceCode),
        text
    );
}
