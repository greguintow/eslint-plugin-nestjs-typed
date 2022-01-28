import {TSESTree} from "@typescript-eslint/types";
import {AST_NODE_TYPES} from "@typescript-eslint/experimental-utils";
import {createRule} from "../../utils/createRule";
import {typedTokenHelpers} from "../../utils/typedTokenHelpers";
import * as classValidator from "class-validator";

const CLASS_VALIDATOR_DECORATOR_NAMES = new Set(
    Object.keys(classValidator as object)
);

CLASS_VALIDATOR_DECORATOR_NAMES.delete("IsOptional");

export const shouldUseRequiredDecorator = (
    node: TSESTree.PropertyDefinition
): boolean => {
    const hasOptionalDecorator = typedTokenHelpers.nodeHasDecoratorsNamed(
        node,
        ["ApiPropertyOptional", "IsOptional"]
    );

    const isOptionalPropertyValue =
        typedTokenHelpers.isOptionalPropertyValue(node);

    if (!isOptionalPropertyValue) {
        const [field] = typedTokenHelpers.getDecoratorsNamedOrdered(node, [
            "Field",
        ]);
        if (field) {
            const fieldArguments = (field.expression as TSESTree.CallExpression)
                .arguments as TSESTree.ObjectExpression[];
            const isOptionalValue = fieldArguments.some((argument) =>
                typedTokenHelpers.getPropertyValueEqualsExpected(
                    argument,
                    "nullable",
                    true
                )
            );
            if (isOptionalValue) return true;
        }
    }

    return hasOptionalDecorator && !isOptionalPropertyValue;
};

export const shouldUseOptionalDecorator = (
    node: TSESTree.PropertyDefinition
): boolean => {
    const hasRequiredDecorator = typedTokenHelpers.nodeHasDecoratorsNamed(
        node,
        ["ApiProperty"]
    );

    const isOptionalPropertyValue =
        typedTokenHelpers.isOptionalPropertyValue(node);
    if (isOptionalPropertyValue) {
        const [field, isOptional] = typedTokenHelpers.getDecoratorsNamedOrdered(
            node,
            ["Field", "IsOptional"]
        );
        let isSetAsRequired = false;
        if (field) {
            const fieldArguments = (field.expression as TSESTree.CallExpression)
                .arguments as TSESTree.ObjectExpression[];
            isSetAsRequired =
                !fieldArguments.some((argument) =>
                    typedTokenHelpers.getPropertyValueEqualsExpected(
                        argument,
                        "nullable",
                        true
                    )
                ) ||
                fieldArguments.some((argument) =>
                    typedTokenHelpers.getPropertyValueEqualsExpected(
                        argument,
                        "nullable",
                        false
                    )
                );
        }
        const hasDecorator = node.decorators?.some(
            (decorator) =>
                decorator.expression.type === AST_NODE_TYPES.CallExpression &&
                decorator.expression.callee.type ===
                    AST_NODE_TYPES.Identifier &&
                CLASS_VALIDATOR_DECORATOR_NAMES.has(
                    decorator.expression.callee.name
                )
        );
        if (!isOptional && hasDecorator) {
            isSetAsRequired = true;
        }

        if (isSetAsRequired) return true;
    }

    return hasRequiredDecorator && isOptionalPropertyValue;
};

const rule = createRule({
    name: "api-property-matches-property-optionality",
    meta: {
        docs: {
            description: "Properties should have correct nullable decorators",
            recommended: false,
            requiresTypeChecking: false,
        },
        messages: {
            shouldUseOptionalDecorator: `Property marked as optional should use @IsOptional decorator and Field as nullable true`,
            shouldUseRequiredDecorator: `Property marked as required should not use nullable decorators`,
        },
        schema: [],
        hasSuggestions: false,
        type: "suggestion",
    },
    defaultOptions: [],

    create(context) {
        return {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            PropertyDefinition(node: TSESTree.PropertyDefinition): void {
                if (shouldUseOptionalDecorator(node)) {
                    context.report({
                        node,
                        messageId: "shouldUseOptionalDecorator",
                    });
                }
                if (shouldUseRequiredDecorator(node)) {
                    context.report({
                        node,
                        messageId: "shouldUseRequiredDecorator",
                    });
                }
            },
        };
    },
});

export default rule;
