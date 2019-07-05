export const tsconfig =
`{
    "compilerOptions": {
        "target": "es5",
        "module": "commonjs",
        "lib": ["es6"],
        "declaration": true,
        "removeComments": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "moduleResolution": "node",
        "baseUrl": ".",
        "types": ["./typings"],
        "esModuleInterop": true,
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        "resolveJsonModule": true,
        "rootDir": "src"
    },
    "include": [
        "src/*.ts",
        "src/**/*.ts"
    ]
}`;