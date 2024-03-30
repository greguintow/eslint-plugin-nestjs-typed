import {createRule} from "../../utils/createRule";

const rule = createRule({
    name: "no-unnecessary-public",
    meta: {
        docs: {
            description:
                "Disallow public keyword in class methods that are not constructors.",
            requiresTypeChecking: false,
        },
        messages: {
            shouldNotIncludePublic:
                "Unnecessary public keyword in class method.",
        },
        schema: [],
        hasSuggestions: false,
        fixable: "code",
        type: "suggestion",
    },
    defaultOptions: [],

    create(context) {
        return {
            MethodDefinition(node) {
                const allowedKinds = ["method", "constructor"];

                if (
                    allowedKinds.includes(node.kind) &&
                    node.accessibility === "public"
                ) {
                    context.report({
                        node,
                        messageId: "shouldNotIncludePublic",
                        fix: (fixer) => {
                            const sourceCode = context.getSourceCode();
                            const methodText = sourceCode.getText(node);
                            const methodWithoutPublic = methodText.replace(
                                "public ",
                                ""
                            );
                            return fixer.replaceText(node, methodWithoutPublic);
                        },
                    });
                }
            },
        };
    },
});

export default rule;
