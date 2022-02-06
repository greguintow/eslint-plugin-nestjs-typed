import {TSESTree} from "@typescript-eslint/experimental-utils";
import {RuleFixer} from "@typescript-eslint/experimental-utils/dist/ts-eslint";

export function removeDecorator(fixer: RuleFixer, node: TSESTree.Decorator) {
    const [rangeStart, end] = node.range;
    const start = rangeStart - node.loc.start.column - 1;

    return fixer.removeRange([start, end]);
}
