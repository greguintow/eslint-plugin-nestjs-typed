export = {
    parser: "@typescript-eslint/parser",
    parserOptions: {sourceType: "module"},
    rules: {
        //  "nestjs-typed/api-methods-have-documentation": "error",
        "@greguintow/nestjs-typed/provided-injected-should-match-factory-parameters":
            "error",
        "@greguintow/nestjs-typed/injectable-should-be-provided": [
            "error",
            {
                src: ["src/**/*.ts"],
                filterFromPaths: ["node_modules", ".test.", ".spec."],
            },
        ],
        "@greguintow/nestjs-typed/api-property-matches-property-optionality":
            "error",
        "@greguintow/nestjs-typed/api-method-should-specify-api-response":
            "error",
        "@greguintow/nestjs-typed/controllers-should-supply-api-tags": "error",
        "@greguintow/nestjs-typed/api-enum-property-best-practices": "error",
        "@greguintow/nestjs-typed/api-property-returning-array-should-set-array":
            "error",
        "@greguintow/nestjs-typed/should-specify-forbid-unknown-values":
            "error",
        "@greguintow/nestjs-typed/param-decorator-name-matches-route-param":
            "error",
        "@greguintow/nestjs-typed/validated-non-primitive-property-needs-type-decorator":
            "error",
        "@greguintow/nestjs-typed/validate-nested-of-array-should-set-each":
            "error",
        "@greguintow/nestjs-typed/all-properties-are-whitelisted": "error",
        "@greguintow/nestjs-typed/no-unnecessary-public": "error",
    },
};
