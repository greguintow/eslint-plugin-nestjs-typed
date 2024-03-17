import {TSESTree} from "@typescript-eslint/utils";
import {
    isClosingParenToken,
    isOpeningParenToken,
    isParenthesized,
} from "@typescript-eslint/utils/ast-utils";
import {SourceCode} from "@typescript-eslint/utils/ts-eslint";

function getParenthesizedTimes(
    node: TSESTree.Node,
    sourceCode: Readonly<SourceCode>
) {
    // Workaround for https://github.com/mysticatea/eslint-utils/pull/25
    if (!node.parent) {
        return 0;
    }

    let times = 0;

    while (isParenthesized(times + 1, node, sourceCode)) {
        times++;
    }

    return times;
}

export function getParentheses(
    node: TSESTree.Node,
    sourceCode: Readonly<SourceCode>
) {
    const count = getParenthesizedTimes(node, sourceCode);

    if (count === 0) {
        return [];
    }

    return [
        ...sourceCode.getTokensBefore(node, {
            count,
            filter: isOpeningParenToken,
        }),
        ...sourceCode.getTokensAfter(node, {
            count,
            filter: isClosingParenToken,
        }),
    ];
}

export function getParenthesizedRange(
    node: TSESTree.Node,
    sourceCode: Readonly<SourceCode>
): [number, number] {
    const parentheses = getParentheses(node, sourceCode);
    const [start] = (parentheses[0] || node).range;
    const [, end] = (parentheses.at(-1) || node).range;
    return [start, end];
}

export function getParenthesizedText(
    node: TSESTree.Node,
    sourceCode: Readonly<SourceCode>
) {
    const [start, end] = getParenthesizedRange(node, sourceCode);
    return sourceCode.text.slice(start, end);
}

export function stripObject(text: string) {
    return text
        .replaceAll(/{|}/g, "")
        .trim()
        .replace(/,$/, "")
        .replaceAll(/\s+/g, " ");
}

export function getPropertiesOfObjectWithNoBrackets(
    node: TSESTree.ObjectExpression,
    sourceCode: Readonly<SourceCode>
) {
    return stripObject(getParenthesizedText(node, sourceCode));
}

export function addSpaces(n: number) {
    return " ".repeat(n);
}
