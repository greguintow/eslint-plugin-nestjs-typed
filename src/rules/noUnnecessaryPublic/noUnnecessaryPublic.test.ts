import {RuleTester} from "@typescript-eslint/rule-tester";
import {getFixturesRootDirectory} from "../../testing/fixtureSetup";
import rule from "./noUnnecessaryPublic";
import {outdent} from "outdent";

const tsRootDirectory = getFixturesRootDirectory();
const ruleTester = new RuleTester({
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2015,
        tsconfigRootDir: tsRootDirectory,
        project: "./tsconfig.json",
    },
});

ruleTester.run("no-unnecessary-public", rule, {
    valid: [
        {
            name: "should allow public property in constructor",
            code: outdent`
              class Test {
                constructor(public value: string) {}
              }
            `,
        },
        {
            name: "should allow private keyword",
            code: outdent`
              class Test {
                private test() {}
              }
            `,
        },
        {
            name: "should allow plain property",
            code: outdent`
              class Test {
                test: string
              }
            `,
        },
    ],
    invalid: [
        {
            name: "should not allow allow method with public",
            code: outdent`
              class Test {
                public test() {}
              }
            `,
            output: outdent`
              class Test {
                test() {}
              }
            `,
            errors: [{messageId: "shouldNotIncludePublic"}],
        },
        {
            name: "should not allow allow property with public",
            code: outdent`
              class Test {
                public test: string
              }
            `,
            output: outdent`
              class Test {
                test: string
              }
            `,
            errors: [{messageId: "shouldNotIncludePublic"}],
        },
        {
            name: "should not allow allow constructor with public",
            code: outdent`
              class Test {
                public constructor(public value: string) {}

                public test() {}

                private other() {}
              }
            `,
            output: outdent`
              class Test {
                constructor(public value: string) {}

                test() {}

                private other() {}
              }
            `,
            errors: [
                {messageId: "shouldNotIncludePublic"},
                {messageId: "shouldNotIncludePublic"},
            ],
        },
    ],
});
