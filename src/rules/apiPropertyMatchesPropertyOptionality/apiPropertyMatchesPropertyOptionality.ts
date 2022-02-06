import {TSESTree} from "@typescript-eslint/types";
import {AST_NODE_TYPES} from "@typescript-eslint/experimental-utils";
import {createRule} from "../../utils/createRule";
import {typedTokenHelpers} from "../../utils/typedTokenHelpers";
import * as classValidator from "class-validator";
import {
    RuleContext,
    RuleFix,
} from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import {appendArgument} from "../../utils/appendArgument";
import {replaceArgument} from "../../utils/replaceArgument";
import {
    getPropertiesOfObjectWithNoBrackets,
    stripObject,
} from "../../utils/parentheses";
import {renameDecorator} from "../../utils/renameDecorator";
import {appendDecorator} from "../../utils/appendDecorator";
import {removeDecorator} from "../../utils/removeDecorator";

const CLASS_VALIDATOR_DECORATOR_NAMES = new Set(
    Object.keys(classValidator as object)
);

CLASS_VALIDATOR_DECORATOR_NAMES.delete("IsOptional");

type Context = Readonly<
    RuleContext<
        | "shouldUseOptionalDecorator"
        | "shouldUseRequiredDecorator"
        | "shouldAddIsOptional"
        | "shouldRemoveNullableFromField"
        | "shouldSetFieldAsNullable",
        never[]
    >
>;

export const shouldUseRequiredDecorator = (
    node: TSESTree.PropertyDefinition,
    context: Context
) => {
    const sourceCode = context.getSourceCode();
    const isOptionalPropertyValue =
        typedTokenHelpers.isOptionalPropertyValue(node);

    if (isOptionalPropertyValue) return;

    const [field, apiPropertyOptional, isOptionalDecorator] =
        typedTokenHelpers.getDecoratorsNamedOrdered(node, [
            "Field",
            "ApiPropertyOptional",
            "IsOptional",
        ]);
    if (field) {
        const fieldArgument = (
            field.expression as TSESTree.CallExpression
        ).arguments.find(
            (argument) => argument.type === AST_NODE_TYPES.ObjectExpression
        ) as TSESTree.ObjectExpression | undefined;
        if (fieldArgument) {
            const nullableProperty = typedTokenHelpers.getPropertyWithValue(
                fieldArgument,
                "nullable",
                true
            );
            if (nullableProperty) {
                context.report({
                    messageId: "shouldRemoveNullableFromField",
                    node: field,
                    fix(fixer) {
                        if (fieldArgument.properties.length === 1) {
                            return fixer.removeRange(fieldArgument.range);
                        }
                        const argumentText = sourceCode.getText(fieldArgument);
                        const text = sourceCode.getText(nullableProperty);
                        const newArgumentText = argumentText.replace(text, "");
                        return replaceArgument(
                            fixer,
                            fieldArgument,
                            `{ ${stripObject(newArgumentText)} }`,
                            sourceCode
                        );
                    },
                });
            }
        }
    }
    if (apiPropertyOptional || isOptionalDecorator) {
        context.report({
            messageId: "shouldUseRequiredDecorator",
            node,
            fix(fixer) {
                return [
                    apiPropertyOptional
                        ? renameDecorator(
                              fixer,
                              apiPropertyOptional,
                              "ApiProperty"
                          )
                        : undefined,
                    isOptionalDecorator
                        ? removeDecorator(fixer, isOptionalDecorator)
                        : undefined,
                ].filter(Boolean) as readonly RuleFix[];
            },
        });
    }
};

export function shouldUseOptionalDecorator(
    node: TSESTree.PropertyDefinition,
    context: Context
) {
    const sourceCode = context.getSourceCode();
    const isOptionalPropertyValue =
        typedTokenHelpers.isOptionalPropertyValue(node);

    if (!isOptionalPropertyValue) return;
    const [field, isOptional, apiProperty] =
        typedTokenHelpers.getDecoratorsNamedOrdered(node, [
            "Field",
            "IsOptional",
            "ApiProperty",
        ]);
    let isSetAsRequired = false;
    if (field) {
        const fieldArguments = (field.expression as TSESTree.CallExpression)
            .arguments as TSESTree.ObjectExpression[];
        let hasNullable = false;
        isSetAsRequired =
            !fieldArguments.some((argument) =>
                typedTokenHelpers.getPropertyValueEqualsExpected(
                    argument,
                    "nullable",
                    true
                )
            ) ||
            fieldArguments.some((argument) => {
                if (
                    typedTokenHelpers.getPropertyValueEqualsExpected(
                        argument,
                        "nullable",
                        false
                    )
                ) {
                    hasNullable = true;
                    return true;
                }
                return false;
            });
        if (isSetAsRequired) {
            context.report({
                node: field,
                messageId: "shouldSetFieldAsNullable",
                fix(fixer) {
                    if (fieldArguments.length > 0 && hasNullable) {
                        const foundPropertyOfName = fieldArguments
                            .flatMap((argument) => argument.properties)
                            .find(
                                (p) =>
                                    (
                                        (p as TSESTree.Property)
                                            .key as TSESTree.Identifier
                                    ).name === "nullable"
                            ) as TSESTree.Property;
                        if (foundPropertyOfName) {
                            return fixer.replaceText(
                                foundPropertyOfName.value,
                                "true"
                            );
                        }
                    } else {
                        switch (fieldArguments.length) {
                            case 0: {
                                return appendArgument(
                                    fixer,
                                    field.expression as TSESTree.CallExpression,
                                    `{ nullable: true }`,
                                    sourceCode
                                );
                            }
                            case 2: {
                                const secondArgumentText =
                                    getPropertiesOfObjectWithNoBrackets(
                                        fieldArguments[1],
                                        sourceCode
                                    );

                                return replaceArgument(
                                    fixer,
                                    fieldArguments[1],
                                    `{ ${secondArgumentText}, nullable: true }`,
                                    sourceCode
                                );
                            }
                            case 1: {
                                if (
                                    fieldArguments[0].type !==
                                    AST_NODE_TYPES.ObjectExpression
                                ) {
                                    return appendArgument(
                                        fixer,
                                        field.expression as TSESTree.CallExpression,
                                        `{ nullable: true }`,
                                        sourceCode
                                    );
                                }
                                const firstArgumentText =
                                    getPropertiesOfObjectWithNoBrackets(
                                        fieldArguments[0],
                                        sourceCode
                                    );

                                return replaceArgument(
                                    fixer,
                                    fieldArguments[0],
                                    `{ ${firstArgumentText}, nullable: true }`,
                                    sourceCode
                                );
                            }
                        }
                    }
                    return null;
                },
            });
        }
    }
    const shouldAddIsOptional =
        !isOptional &&
        node.decorators?.some(
            (decorator) =>
                decorator.expression.type === AST_NODE_TYPES.CallExpression &&
                decorator.expression.callee.type ===
                    AST_NODE_TYPES.Identifier &&
                CLASS_VALIDATOR_DECORATOR_NAMES.has(
                    decorator.expression.callee.name
                )
        );

    if (shouldAddIsOptional) {
        context.report({
            node,
            messageId: "shouldAddIsOptional",
            fix(fixer) {
                return appendDecorator(fixer, node, "@IsOptional()");
            },
        });
    }
    if (apiProperty) {
        context.report({
            node: apiProperty,
            messageId: "shouldUseOptionalDecorator",
            fix(fixer) {
                return renameDecorator(
                    fixer,
                    apiProperty,
                    "ApiPropertyOptional"
                );
            },
        });
    }
}

const rule = createRule({
    name: "api-property-matches-property-optionality",
    meta: {
        docs: {
            description: "Properties should have correct nullable decorators",
            recommended: false,
            requiresTypeChecking: false,
        },
        messages: {
            shouldUseOptionalDecorator: `Property marked as optional should use @ApiPropertyOptional decorator`,
            shouldSetFieldAsNullable: `Property marked as optional should use @Field as nullable true`,
            shouldAddIsOptional: `Property marked as optional should add @IsOptional when there are other class validator decorators`,
            shouldUseRequiredDecorator: `Property marked as required should not use nullable decorators`,
            shouldRemoveNullableFromField: `Property marked as required should not use @Field with nullable true`,
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
            PropertyDefinition(node: TSESTree.PropertyDefinition): void {
                shouldUseOptionalDecorator(node, context);
                shouldUseRequiredDecorator(node, context);
            },
        };
    },
});

export default rule;
