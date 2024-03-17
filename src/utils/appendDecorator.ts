import {TSESTree} from "@typescript-eslint/utils";
import {RuleFixer} from "@typescript-eslint/utils/ts-eslint";
import {addSpaces} from "./parentheses";

export function appendDecorator(
    fixer: RuleFixer,
    node: TSESTree.PropertyDefinition,
    text: string
) {
    const numberSpacesProperty = node.key.loc.start.column;
    const spaces = addSpaces(numberSpacesProperty);
    return fixer.insertTextBefore(node.key, `${text}\n${spaces}`);
}
