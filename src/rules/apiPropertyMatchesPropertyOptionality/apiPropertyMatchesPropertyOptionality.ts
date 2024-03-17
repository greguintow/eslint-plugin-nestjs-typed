import {TSESTree, AST_NODE_TYPES} from "@typescript-eslint/utils";
import {createRule} from "../../utils/createRule";
import {RuleContext, RuleFix} from "@typescript-eslint/utils/ts-eslint";
import {typedTokenHelpers} from "../../utils/typedTokenHelpers";
import * as classValidator from "class-validator";
import {appendArgument} from "../../utils/appendArgument";
import {replaceArgument} from "../../utils/replaceArgument";
import {getPropertiesOfObjectWithNoBrackets} from "../../utils/parentheses";
import {renameDecorator} from "../../utils/renameDecorator";
import {appendDecorator} from "../../utils/appendDecorator";
import {removeDecorator} from "../../utils/removeDecorator";
import {removeProperty} from "../../utils/removeProperty";
import {appendImport} from "../../utils/appendImport";

const CLASS_VALIDATOR_DECORATOR_NAMES = new Set(
    Object.keys(classValidator as object)
);

CLASS_VALIDATOR_DECORATOR_NAMES.delete("IsOptional");

type MessageIds =
    | "shouldUseOptionalDecorator"
    | "shouldUseRequiredDecorator"
    | "shouldAddIsOptional"
    | "shouldRemoveNullableFromField"
    | "shouldSetFieldAsNullable";

type RuleOptions = [
    {
        shouldDisableField: boolean;
    },
];

type Context = Readonly<RuleContext<MessageIds, RuleOptions>>;

export const shouldUseRequiredDecorator = (
    node: TSESTree.PropertyDefinition,
    context: Context,
    disableField?: boolean
) => {
    const sourceCode = context.getSourceCode();
    const isOptionalPropertyValue =
        typedTokenHelpers.isOptionalPropertyValue(node);

    if (isOptionalPropertyValue) return;

    const [field, apiPropertyOptional, isOptionalDecorator, apiProperty] =
        typedTokenHelpers.getDecoratorsNamedOrdered(node, [
            "Field",
            "ApiPropertyOptional",
            "IsOptional",
            "ApiProperty",
        ]);
    if (field && !disableField) {
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
                        return removeProperty(
                            fixer,
                            fieldArgument,
                            sourceCode,
                            "nullable"
                        );
                    },
                });
            }
        }
    }
    let shouldRemoveRequiredFalse = false;
    let apiPropertyArgument: TSESTree.ObjectExpression | undefined;
    if (apiProperty) {
        apiPropertyArgument = (
            ((apiProperty.expression as TSESTree.CallExpression).arguments ||
                []) as TSESTree.ObjectExpression[]
        )[0];

        if (apiPropertyArgument) {
            shouldRemoveRequiredFalse =
                typedTokenHelpers.getPropertyValueEqualsExpected(
                    apiPropertyArgument,
                    "required",
                    false
                );
        }
    }

    if (
        apiPropertyOptional ||
        isOptionalDecorator ||
        shouldRemoveRequiredFalse
    ) {
        context.report({
            messageId: "shouldUseRequiredDecorator",
            node,
            fix(fixer) {
                const fixes = [
                    isOptionalDecorator
                        ? removeDecorator(fixer, isOptionalDecorator)
                        : undefined,
                    shouldRemoveRequiredFalse && apiPropertyArgument
                        ? apiPropertyArgument.properties.length === 1
                            ? fixer.removeRange(apiPropertyArgument.range)
                            : removeProperty(
                                  fixer,
                                  apiPropertyArgument,
                                  sourceCode,
                                  "required"
                              )!
                        : undefined,
                    apiPropertyOptional
                        ? renameDecorator(
                              fixer,
                              apiPropertyOptional,
                              "ApiProperty"
                          )
                        : undefined,
                ].filter(Boolean) as RuleFix[];
                return fixes;
            },
        });
    }
};

export function shouldUseOptionalDecorator(
    node: TSESTree.PropertyDefinition,
    context: Context,
    disableField?: boolean
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
    if (field && !disableField) {
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
                const fixes: RuleFix[] = [];
                const lines = sourceCode.getLines();
                const lastImport = lines
                    .filter((line) => line.startsWith("import"))
                    .pop();
                if (lastImport) {
                    const lastImportIndex = lines.indexOf(lastImport);
                    let importDeclaration:
                        | TSESTree.ImportDeclaration
                        | undefined;
                    lines.slice(0, lastImportIndex + 1).some((line, index) => {
                        const importNode = sourceCode.getNodeByRangeIndex(
                            sourceCode.getIndexFromLoc({
                                line: index + 1,
                                column: 0,
                            })
                        );
                        if (!importNode) return false;
                        const isImportDeclaration =
                            importNode.type ===
                            AST_NODE_TYPES.ImportDeclaration;
                        if (!isImportDeclaration) return false;
                        const isClassValidatorImport =
                            importNode.source.value === "class-validator";
                        if (isClassValidatorImport) {
                            importDeclaration = importNode;
                        }
                        return isClassValidatorImport;
                    });

                    if (importDeclaration) {
                        const hasIsOptionalImport =
                            importDeclaration.specifiers.some(
                                (specifier) =>
                                    specifier.type ===
                                        AST_NODE_TYPES.ImportSpecifier &&
                                    specifier.imported.name === "IsOptional"
                            );
                        if (!hasIsOptionalImport) {
                            fixes.push(
                                appendImport(
                                    fixer,
                                    importDeclaration,
                                    "IsOptional",
                                    sourceCode
                                )
                            );
                        }
                    }
                }
                fixes.push(appendDecorator(fixer, node, "@IsOptional()"));
                return fixes;
            },
        });
    }
    if (apiProperty) {
        context.report({
            node: apiProperty,
            messageId: "shouldUseOptionalDecorator",
            fix(fixer) {
                const [apiPropertyArgument] = ((
                    apiProperty.expression as TSESTree.CallExpression
                ).arguments || []) as TSESTree.ObjectExpression[];
                const fixes: RuleFix[] = [];

                if (apiPropertyArgument) {
                    const hasRequiredFalse =
                        typedTokenHelpers.getPropertyValueEqualsExpected(
                            apiPropertyArgument,
                            "required",
                            false
                        );
                    if (hasRequiredFalse) {
                        if (apiPropertyArgument.properties.length > 1) {
                            fixes.push(
                                removeProperty(
                                    fixer,
                                    apiPropertyArgument,
                                    sourceCode,
                                    "required"
                                )!
                            );
                        } else {
                            fixes.push(
                                fixer.removeRange(apiPropertyArgument.range)
                            );
                        }
                    }
                }
                fixes.push(
                    renameDecorator(fixer, apiProperty, "ApiPropertyOptional")
                );
                return fixes;
            },
        });
    }
}

const rule = createRule<RuleOptions, MessageIds>({
    name: "api-property-matches-property-optionality",
    meta: {
        docs: {
            description: "Properties should have correct nullable decorators",
            requiresTypeChecking: false,
        },
        messages: {
            shouldUseOptionalDecorator: `Property marked as optional should use @ApiPropertyOptional decorator`,
            shouldSetFieldAsNullable: `Property marked as optional should use @Field as nullable true`,
            shouldAddIsOptional: `Property marked as optional should add @IsOptional when there are other class validator decorators`,
            shouldUseRequiredDecorator: `Property marked as required should not use nullable decorators`,
            shouldRemoveNullableFromField: `Property marked as required should not use @Field with nullable true`,
        },
        schema: [
            {
                properties: {
                    shouldDisableField: {
                        description: "boolean to not check the Field decorator",
                        type: "boolean",
                    },
                },
            },
        ],
        hasSuggestions: false,
        fixable: "code",
        type: "suggestion",
    },
    defaultOptions: [{shouldDisableField: false}],

    create(context) {
        const {shouldDisableField = false} = context.options[0] || {};

        return {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            PropertyDefinition(node: TSESTree.PropertyDefinition): void {
                shouldUseOptionalDecorator(node, context, shouldDisableField);
                shouldUseRequiredDecorator(node, context, shouldDisableField);
            },
        };
    },
});

export default rule;
