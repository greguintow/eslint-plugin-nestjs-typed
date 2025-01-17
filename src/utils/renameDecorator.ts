import {TSESTree} from "@typescript-eslint/experimental-utils";
import {RuleFixer} from "@typescript-eslint/experimental-utils/dist/ts-eslint";

export function renameDecorator(
    fixer: RuleFixer,
    node: TSESTree.Decorator,
    newName: string
) {
    const expression = node.expression as TSESTree.CallExpression & {
        callee: TSESTree.Identifier;
    };
    const decoratorName = expression.callee.name;
    const start = expression.callee.range[0];
    const end = start + decoratorName.length;
    return fixer.replaceTextRange([start, end], newName);
}
