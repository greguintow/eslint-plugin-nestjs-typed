import {TSESTree} from "@typescript-eslint/types";
import {createRule} from "../../utils/createRule";
import {addSpaces} from "../../utils/parentheses";

const rule = createRule({
    name: "no-return-logger",
    meta: {
        docs: {
            description:
                "Disallow Logger or console in return statements and auto-fix by moving return to the next line",
            requiresTypeChecking: false,
        },
        messages: {
            shouldNotReturnLogger:
                "Do not use Logger or console in return statement.",
        },
        schema: [],
        hasSuggestions: false,
        fixable: "code",
        type: "suggestion",
    },
    defaultOptions: [],

    create(context) {
        return {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            ReturnStatement: (node) => {
                const callExpression =
                    node.argument as TSESTree.CallExpression | null;
                let calleeObject =
                    callExpression?.callee?.type === "MemberExpression"
                        ? (callExpression.callee.object as
                              | TSESTree.MemberExpression
                              | TSESTree.Identifier)
                        : null;

                if (
                    calleeObject?.type === "MemberExpression" &&
                    calleeObject?.object?.type === "ThisExpression" &&
                    calleeObject?.property?.type === "Identifier" &&
                    calleeObject?.property?.name === "logger"
                ) {
                    calleeObject = calleeObject.property;
                }

                const validLoggers = ["Logger", "console", "logger"];

                if (
                    callExpression &&
                    calleeObject &&
                    calleeObject.type === "Identifier" &&
                    validLoggers.includes(calleeObject.name)
                ) {
                    context.report({
                        node,
                        messageId: "shouldNotReturnLogger",
                        fix: (fixer) => {
                            const sourceCode = context.getSourceCode();
                            const argumentText =
                                sourceCode.getText(callExpression);

                            const returnStatement = `\n${addSpaces(
                                node.loc.start.column
                            )}return`;

                            const newText = `${argumentText}${returnStatement}`;

                            if (
                                node.parent &&
                                node.parent.type === "IfStatement"
                            ) {
                                const ifStatementLine =
                                    sourceCode.lines[
                                        node.parent.loc.start.line - 1
                                    ];
                                const match = ifStatementLine.match(/^(\s*)/);
                                const indentation = match ? match[1] : "";

                                const isConsequent =
                                    node.parent.consequent === node;
                                const targetNode = isConsequent
                                    ? node.parent.consequent
                                    : node.parent.alternate;

                                if (
                                    targetNode &&
                                    targetNode.type !== "BlockStatement"
                                ) {
                                    // If the target node is not already a BlockStatement, wrap it in curly braces
                                    const replacementText = `{\n${indentation}  ${argumentText}\n${indentation}  return\n${indentation}}`;

                                    return fixer.replaceText(
                                        targetNode,
                                        replacementText
                                    );
                                }
                            }

                            return fixer.replaceText(node, newText);
                        },
                    });
                }
            },
        };
    },
});

export default rule;
