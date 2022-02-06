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
            name: "should replace ApiPropertyOptional with ApiProperty",
            code: `class TestClass {@Expose()
                @ApiPropertyOptional()
                thisIsAStringProp: string;}`,
            output: `class TestClass {@Expose()
                @ApiProperty()
                thisIsAStringProp: string;}`,
            errors: [
                {
                    messageId: "shouldUseRequiredDecorator",
                },
            ],
        },
        {
            name: "should replace ApiProperty with ApiPropertyOptional",
            code: `class TestClass {@Expose()
                @ApiProperty()
                thisIsAStringProp?: string;}`,
            output: `class TestClass {@Expose()
                @ApiPropertyOptional()
                thisIsAStringProp?: string;}`,
            errors: [
                {
                    messageId: "shouldUseOptionalDecorator",
                },
            ],
        },
        {
            name: "should replace ApiProperty with ApiPropertyOptional when is not marked with ? but is possibly undefined",
            code: `class TestClass {@Expose()
                @ApiProperty()
                thisIsAStringProp: string | undefined;}`,
            output: `class TestClass {@Expose()
                @ApiPropertyOptional()
                thisIsAStringProp: string | undefined;}`,
            errors: [
                {
                    messageId: "shouldUseOptionalDecorator",
                },
            ],
        },
        {
            name: "should add IsOptional decorator",
            code: `class TestClass {
                @Field({ nullable: true })
                @IsString()
                thisIsAStringProp?: string;}`,
            output: `class TestClass {
                @Field({ nullable: true })
                @IsString()
                @IsOptional()
                thisIsAStringProp?: string;}`,
            errors: [
                {
                    messageId: "shouldAddIsOptional",
                },
            ],
        },
        {
            name: "should add IsOptional decorator and Field as nullable true",
            code: `class TestClass {
                @Field()
                @IsString()
                thisIsAStringProp?: string;}`,
            output: `class TestClass {
                @Field({ nullable: true })
                @IsString()
                @IsOptional()
                thisIsAStringProp?: string;}`,
            errors: [
                {
                    messageId: "shouldSetFieldAsNullable",
                },
                {
                    messageId: "shouldAddIsOptional",
                },
            ],
        },
        {
            name: "should add nullable true argument with a field decorator with no args",
            code: `class TestClass {
                @Field()
                thisIsAStringProp?: string;}`,
            errors: [
                {
                    messageId: "shouldSetFieldAsNullable",
                },
            ],
            output: `class TestClass {
                @Field({ nullable: true })
                thisIsAStringProp?: string;}`,
        },
        {
            name: "should add nullable true argument with a field decorator when is not marked with ? but is possibly null",
            code: `class TestClass {
                @Field()
                thisIsAStringProp: string | null;}`,
            errors: [
                {
                    messageId: "shouldSetFieldAsNullable",
                },
            ],
            output: `class TestClass {
                @Field({ nullable: true })
                thisIsAStringProp: string | null;}`,
        },
        {
            name: "should add nullable true argument with a field decorator with no args and with IsOptional decorator",
            code: `class TestClass {
                @Field()
                @IsOptional()
                thisIsAStringProp?: string;}`,
            output: `class TestClass {
                @Field({ nullable: true })
                @IsOptional()
                thisIsAStringProp?: string;}`,
            errors: [
                {
                    messageId: "shouldSetFieldAsNullable",
                },
            ],
        },
        {
            name: "should add nullable true with a field decorator with one arg of options",
            code: `class TestClass {
                @Field({ name: 'test' })
                thisIsAStringProp?: string;}`,
            output: `class TestClass {
                @Field({ name: 'test', nullable: true })
                thisIsAStringProp?: string;}`,
            errors: [
                {
                    messageId: "shouldSetFieldAsNullable",
                },
            ],
        },
        {
            name: "should add nullable true with a field decorator with first arg of a type",
            code: `class TestClass {
                @Field(() => foo)
                thisIsAStringProp?: string;}`,
            output: `class TestClass {
                @Field(() => foo, { nullable: true })
                thisIsAStringProp?: string;}`,
            errors: [
                {
                    messageId: "shouldSetFieldAsNullable",
                },
            ],
        },
        {
            name: "should add nullable true with a field decorator with 2 args",
            code: `class TestClass {
                @Field(() => foo, { name: 'test' })
                thisIsAStringProp?: string;}`,
            output: `class TestClass {
                @Field(() => foo, { name: 'test', nullable: true })
                thisIsAStringProp?: string;}`,
            errors: [
                {
                    messageId: "shouldSetFieldAsNullable",
                },
            ],
        },
        {
            name: "should remove nullable true argument and isOptional decorator",
            code: `class TestClass {
                @Field({ nullable: true })
                @IsOptional()
                thisIsAStringProp: string;}`,
            output: `class TestClass {
                @Field()
                thisIsAStringProp: string;}`,
            errors: [
                {
                    messageId: "shouldRemoveNullableFromField",
                },
                {
                    messageId: "shouldUseRequiredDecorator",
                },
            ],
        },
        {
            name: "should remove nullable true property",
            code: `class TestClass {
                @Field({ name: 'test', nullable: true })
                thisIsAStringProp: string;}`,
            output: `class TestClass {
                @Field({ name: 'test' })
                thisIsAStringProp: string;}`,
            errors: [
                {
                    messageId: "shouldRemoveNullableFromField",
                },
            ],
        },
        {
            name: "should remove isOptional decorator",
            code: `class TestClass {
                @IsOptional()
                thisIsAStringProp: string;}`,
            output: `class TestClass {
                thisIsAStringProp: string;}`,
            errors: [
                {
                    messageId: "shouldUseRequiredDecorator",
                },
            ],
        },
    ],
});
