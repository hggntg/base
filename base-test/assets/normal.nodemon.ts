export const nodemon =
`{
    "ignore": ["**/*.test.ts", "**/*.spec.ts", ".git", "node_modules", "src"],
    "watch": [".generated/src"],
    "exec": "ts-node ./.generated/src",
    "ext": "ts"
}`;