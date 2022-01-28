// Should turn off swagger rules for folks not using swagger typings
export = {
    parser: "@typescript-eslint/parser",
    parserOptions: {sourceType: "module"},
    rules: {
        "@greguintow/nestjs-typed/api-property-matches-property-optionality":
            "off",
        "@greguintow/nestjs-typed/api-method-should-specify-api-response":
            "off",
        "@greguintow/nestjs-typed/controllers-should-supply-api-tags": "off",
        "@greguintow/nestjs-typed/api-enum-property-best-practices": "off",
        "@greguintow/nestjs-typed/api-property-returning-array-should-set-array":
            "off",
    },
};
