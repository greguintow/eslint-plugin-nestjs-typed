import {TSESTree} from "@typescript-eslint/experimental-utils";
import {isCommaToken} from "@typescript-eslint/experimental-utils/dist/ast-utils";
import {
    RuleFixer,
    SourceCode,
} from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import {typedTokenHelpers} from "./typedTokenHelpers";

export function removeProperty(
    fixer: RuleFixer,
    node: TSESTree.ObjectExpression,
    sourceCode: Readonly<SourceCode>,
    propertyName: string
) {
    const property = typedTokenHelpers.getPropertyWithName(node, propertyName);
    if (!property) return null;
    const lastToken = sourceCode.getTokenBefore(property);
    const [start] =
        lastToken && isCommaToken(lastToken) ? lastToken.range : property.range;
    const [, end] = property.range;
    return fixer.removeRange([start, end]);
}
