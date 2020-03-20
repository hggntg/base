export const tsconfig =
`{
    "compilerOptions": {
        /* Basic Options */
        "target": "es5", /* Specify ECMAScript target version: 'ES3' (default), 'ES5', 'ES2015', 'ES2016', 'ES2017','ES2018' or 'ESNEXT'. */
        "module": "commonjs", /* Specify module code generation: 'none', 'commonjs', 'amd', 'system', 'umd', 'es2015', or 'ESNext'. */
        "lib": ["es6"], /* Specify library files to be included in the compilation. */
        "declaration": true,                      /* Generates corresponding '.d.ts' file. */
        "removeComments": true, /* Do not emit comments to output. */
        "noImplicitReturns": true, /* Report error when not all code paths in function return a value. */
        "noFallthroughCasesInSwitch": true, /* Report errors for fallthrough cases in switch statement. */
        /* Module Resolution Options */
        "moduleResolution": "node", /* Specify module resolution strategy: 'node' (Node.js) or 'classic' (TypeScript pre-1.6). */
        "baseUrl": ".", /* Base directory to resolve non-absolute module names. */
        "types": ["./typings"], /* Type declaration files to be included in compilation. */
        "esModuleInterop": true, /* Enables emit interoperability between CommonJS and ES Modules via creation of namespace objects for all imports. Implies 'allowSyntheticDefaultImports'. */
        /* Experimental Options */
        "experimentalDecorators": true, /* Enables experimental support for ES7 decorators. */
        "emitDecoratorMetadata": true, /* Enables experimental support for emitting type metadata for decorators. */
        /* Advanced Options */
        "resolveJsonModule": true,
        "rootDir": "src"
    },
    "include": [
        "src/*.ts",
        "src/**/*.ts"
    ]
}`;