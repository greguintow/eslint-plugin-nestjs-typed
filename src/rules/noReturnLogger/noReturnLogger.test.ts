import {RuleTester} from "@typescript-eslint/rule-tester";
import {getFixturesRootDirectory} from "../../testing/fixtureSetup";
import rule from "./noReturnLogger";
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

ruleTester.run("no-return-logger", rule, {
    valid: [
        {
            name: "should allow Logger.log followed by a return statement",
            code: `function test() {
              Logger.log('message')
              return
            }`,
        },
        {
            name: "should allow Logger.error followed by a return statement",
            code: `function test() {
              Logger.error('message')
              return
            }`,
        },
        {
            name: "should allow console.log followed by a return statement",
            code: `function test() {
              console.log('message')
              return
            }`,
        },
        {
            name: "should allow Logger.log followed by a return of a function call",
            code: `function test() {
              Logger.log('message')
              return something()
            }`,
        },
    ],
    invalid: [
        {
            name: "should not allow returning Logger.log directly",
            code: outdent`
              function test() {
                return Logger.log('message')
              }
            `,
            output: outdent`
              function test() {
                Logger.log('message')
                return
              }
            `,
            errors: [{messageId: "shouldNotReturnLogger"}],
        },
        {
            name: "should not allow returning console.log directly",
            code: outdent`
              function test() {
                return console.log('message')
              }
            `,
            output: outdent`
              function test() {
                console.log('message')
                return
              }
            `,
            errors: [{messageId: "shouldNotReturnLogger"}],
        },
        {
            name: "should not allow returning console.error directly",
            code: outdent`
              function test() {
                return console.error('message')
              }
            `,
            output: outdent`
              function test() {
                console.error('message')
                return
              }
            `,
            errors: [{messageId: "shouldNotReturnLogger"}],
        },
        {
            name: "should transform return in if statement to block with Logger call",
            code: outdent`
              function test() {
                if (!user) return console.error('message')
              }
            `,
            output: outdent`
              function test() {
                if (!user) {
                  console.error('message')
                  return
                }
              }
            `,
            errors: [{messageId: "shouldNotReturnLogger"}],
        },
        {
            name: "should transform return in long if condition to block with Logger call",
            code: outdent`
              function test() {
                if (!somethingReallyLarge)
                  return console.error('message')
              }
            `,
            output: outdent`
              function test() {
                if (!somethingReallyLarge)
                  {
                  console.error('message')
                  return
                }
              }
            `,
            errors: [{messageId: "shouldNotReturnLogger"}],
        },
        {
            name: "should transform return in else statement to block with Logger call",
            code: outdent`
              function test() {
                if (user) console.log('message')
                else return console.error('message')
              }
            `,
            output: outdent`
              function test() {
                if (user) console.log('message')
                else {
                  console.error('message')
                  return
                }
              }
            `,
            errors: [{messageId: "shouldNotReturnLogger"}],
        },
    ],
});
