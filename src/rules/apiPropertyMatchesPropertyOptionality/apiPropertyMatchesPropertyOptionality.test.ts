import {RuleTester} from "@typescript-eslint/experimental-utils/dist/eslint-utils";
import {getFixturesRootDirectory} from "../../testing/fixtureSetup";
import rule from "./apiPropertyMatchesPropertyOptionality";

const tsRootDirectory = getFixturesRootDirectory();
const ruleTester = new RuleTester({
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2015,
        tsconfigRootDir: tsRootDirectory,
        project: "./tsconfig.json",
    },
});

ruleTester.run("api-property-matches-property-optionality", rule, {
    valid: [
        {
            code: `class TestClass {
                @Expose()
                @ApiPropertyOptional()
                thisIsAStringProp?: string;}`,
        },
        {
            code: `class TestClass {@Expose()
                @ApiPropertyOptional()
                thisIsAStringProp: string | undefined;}`,
        },
        {
            code: `class TestClass {
                @Field({ nullable: true })
                @IsOptional()
                thisIsAStringProp?: string;}`,
        },
        {
            code: `class TestClass {
                @Field({ nullable: true })
                thisIsAStringProp?: string;}`,
        },
        {
            code: `class TestClass {
                @Field()
                thisIsAStringProp: string;}`,
        },
    ],
    invalid: [
        {
            code: `class TestClass {@Expose()
                @ApiPropertyOptional()
                thisIsAStringProp: string;}`,
            errors: [
                {
                    messageId: "shouldUseRequiredDecorator",
                },
            ],
        },
        {
            code: `class TestClass {@Expose()
                @ApiPropertyOptional()
                thisIsAStringProp!: string;}`,
            errors: [
                {
                    messageId: "shouldUseRequiredDecorator",
                },
            ],
        },
        {
            code: `class TestClass {@Expose()
                @ApiProperty()
                thisIsAStringProp?: string;}`,
            errors: [
                {
                    messageId: "shouldUseOptionalDecorator",
                },
            ],
        },
        {
            code: `class TestClass {@Expose()
                @ApiProperty()
                thisIsAStringProp: string | undefined;}`,
            errors: [
                {
                    messageId: "shouldUseOptionalDecorator",
                },
            ],
        },
        {
            code: `class TestClass {
                @Field({ nullable: true })
                @IsString()
                thisIsAStringProp?: string;}`,
            errors: [
                {
                    messageId: "shouldUseOptionalDecorator",
                },
            ],
        },
        {
            code: `class TestClass {
                @Field()
                thisIsAStringProp?: string;}`,
            errors: [
                {
                    messageId: "shouldUseOptionalDecorator",
                },
            ],
        },
        {
            code: `class TestClass {
                @Field()
                @IsOptional()
                thisIsAStringProp?: string;}`,
            errors: [
                {
                    messageId: "shouldUseOptionalDecorator",
                },
            ],
        },
        {
            code: `class TestClass {
                @Field({ nullable: true })
                @IsOptional()
                thisIsAStringProp: string;}`,
            errors: [
                {
                    messageId: "shouldUseRequiredDecorator",
                },
            ],
        },
        {
            code: `class TestClass {
                @Field()
                @IsOptional()
                thisIsAStringProp: string;}`,
            errors: [
                {
                    messageId: "shouldUseRequiredDecorator",
                },
            ],
        },
        {
            code: `class TestClass {
                @IsOptional()
                thisIsAStringProp: string;}`,
            errors: [
                {
                    messageId: "shouldUseRequiredDecorator",
                },
            ],
        },
    ],
});
