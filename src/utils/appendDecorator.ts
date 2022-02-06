import {TSESTree} from "@typescript-eslint/experimental-utils";
import {RuleFixer} from "@typescript-eslint/experimental-utils/dist/ts-eslint";
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
