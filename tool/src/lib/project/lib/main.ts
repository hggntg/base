import Minimist from "minimist";

const args = Minimist(process.argv.slice(2));

import { log } from "../../../infrastructure/logger";
import { Project, Node, ts, SourceFile, FileSystemHost } from "ts-morph";
import sysPath from "path";
import { eachSeries } from "async";

interface IIntrinsicType {
    kind: "intrinsic";
    name: "string" | "number" | "any" | "void" | "number" | "object" | "array" | "boolean";
}

interface IPropertyType {
    kind: "property";
    name: string;
    type: IInterfaceType | IIntrinsicType;
    optional: boolean;
}

interface IMethodType {
    kind: "method";
    name: string;
    params: (IInterfaceType | IIntrinsicType)[];
    returnType: IIntrinsicType | IInterfaceType;
    optional: boolean;
}

interface IConstructorType {
    kind: "construct";
    name: string;
    params: (IInterfaceType | IIntrinsicType)[];
}

interface IClassType {
    kind: "class";
    name: string;
    properties: IPropertyType[];
    methods: IMethodType[];
    extend: IClassType;
    implements: IInterfaceType[];
    constructors: IConstructorType[];
}

interface IInterfaceType {
    kind: "interface";
    name: string;
    properties: IPropertyType[];
    methods: IMethodType[];
    extends: IInterfaceType[];
}

interface IUpdateSourceFile {
    pos: number,
    text: string
}
const appPath = args.appPath;
const target = args.target;
const targetName = target === "root" ? "index.ts" : args.target + ".ts";
const tsconfig = args.tsconfig;
const project = new Project({
    tsConfigFilePath: sysPath.resolve(sysPath.join(appPath, tsconfig))
});
const fs: FileSystemHost = project.getFileSystem();
const typeDeclares: (IInterfaceType | IClassType)[] = [];
const typeDeclareIndexes = [];



function getInterface(node: Node<ts.Node>, updates: IUpdateSourceFile[]) {
    let type = node.getType();
    let name = type.getSymbol().getName();
    let interfaceType: IInterfaceType = {
        kind: "interface",
        name: name,
        extends: [],
        methods: [],
        properties: []
    };
    type.getProperties().map(function (property) {
        let propertyType = property.getValueDeclarationOrThrow().getType();
        let propertyTypeName = propertyType.getText();
        let propertyName = property.getName();
        if (propertyType.getCallSignatures().length > 0) {
            // log()
        }
        else {
            interfaceType.properties.push({ kind: "property", name: propertyName, optional: false, type: null });
        }
    });
    if (typeDeclareIndexes.indexOf(interfaceType.name) < 0) {
        typeDeclares.push(interfaceType);
        typeDeclareIndexes.push(interfaceType.name);
    }
    // updates.push({
    //     pos: node.getEnd(),
    //     text: `\nType.declare(${JSON.stringify(interfaceType)});`
    // });
}

function visit(node: Node<ts.Node>, updates: IUpdateSourceFile[]): void {

    let childCount = node.getChildCount();
    if (childCount > 0) {
        let childNodes = node.getChildren();
        let childNodeLength = childNodes.length;
        for (let i = 0; i < childNodeLength; i++) {
            let innerNode = childNodes[i];
            visit(innerNode, updates);
        }
        if (node.getKind() === ts.SyntaxKind.InterfaceDeclaration) {
            getInterface(node, updates);
        }
        else if (node.getKind() === ts.SyntaxKind.ClassDeclaration) {
            let className = node.getType().getSymbol().getName();
            let classType: IClassType = {
                kind: "class",
                name: className,
                constructors: [],
                extend: null,
                implements: [],
                methods: [],
                properties: []
            }
            if (typeDeclareIndexes.indexOf(classType.name) < 0) {
                typeDeclares.push(classType);
                typeDeclareIndexes.push(classType.name);
            }
        }
    }
    else {
        if (node.getKind() === ts.SyntaxKind.InterfaceDeclaration) {
            getInterface(node, updates);
        }
        else if (node.getKind() === ts.SyntaxKind.ClassDeclaration) {
            let className = node.getType().getSymbol().getName();
            let classType: IClassType = {
                kind: "class",
                name: className,
                constructors: [],
                extend: null,
                implements: [],
                methods: [],
                properties: []
            }
            if (typeDeclareIndexes.indexOf(classType.name) < 0) {
                typeDeclares.push(classType);
                typeDeclareIndexes.push(classType.name);
            }
        }
    }
}

async function processSourceFile(sourceFile: SourceFile, generatedPath: string){
    await sourceFile.refreshFromFileSystem();
    let srcIndex = sourceFile.getFilePath().lastIndexOf("src");
    let filePath = sourceFile.getFilePath().substring(srcIndex, sourceFile.getFilePath().length);
    log("Generating file " + filePath);
    try {
        let destPathName = filePath;
        if(filePath === `src/${targetName}`){
            destPathName = "src/index.ts";
        }
        let destPath = `${generatedPath}/${destPathName}`;
        if (await fs.fileExists(destPath)) {
            await fs.delete(destPath);
        }
        let copiedSourceFile = sourceFile.copy(destPath, { overwrite: true });
        try {
            let sourceRootDeclarations = sourceFile.getImportDeclarations();
            let importPaths = [];
            sourceRootDeclarations.map((sourceRootDeclaration) => {
                try {
                    importPaths.push(sourceRootDeclaration.getModuleSpecifierValue());
                }
                catch (e) {
                    throw e;
                }
            });
            let sourceRootExportations = sourceFile.getExportDeclarations();
            let exportPaths = [];
            sourceRootExportations.map((sourceRootExportation) => {
                try {
                    exportPaths.push(sourceRootExportation.getModuleSpecifierValue());
                }
                catch (e) {
                    throw e;
                }
            });

            let declarations = copiedSourceFile.getImportDeclarations();
            declarations.map((declaration, index) => {
                try {
                    if (importPaths[index] !== declaration.getModuleSpecifierValue()) {
                        declaration.setModuleSpecifier(importPaths[index]);
                    }
                }
                catch (e) {
                    throw e;
                }
            });

            let exportations = copiedSourceFile.getExportDeclarations();
            exportations.map((exportation, index) => {
                try {
                    if (exportPaths[index] !== exportation.getModuleSpecifierValue()) {
                        exportation.setModuleSpecifier(exportPaths[index]);
                    }
                }
                catch (e) {
                    throw e;
                }
            });
        }
        catch (e) {
            throw e;
        }

        if (filePath === `src/${targetName}`) {
            let importCoreText = `import "./core";\n`;
            copiedSourceFile.insertText(0, `import "./core";\n`);
            copiedSourceFile.insertText(importCoreText.length, `import "./declare";\n`);
        }
        let childNodes = copiedSourceFile.getChildren();
        let childNodeLength = childNodes.length;
        let updates: IUpdateSourceFile[] = [];
        for (let i = 0; i < childNodeLength; i++) {
            visit(childNodes[i], updates);
        }
        let increment = 0;
        let promiseList: Promise<void>[] = [];
        updates.map((updateItem) => {
            let pos = updateItem.pos + increment;
            let text = updateItem.text;
            copiedSourceFile.insertText(pos, text);
            increment += text.length;
        });

        copiedSourceFile.getClasses().map((classMember) => {
            let className = classMember.getName();
            if(!classMember.getStaticMethod("getType")){
                classMember.addMethod({
                    isStatic: true,
                    name: "getType",
                    returnType: "IClassType",
                    statements: [
                        `return Type.get("${className}", "class") as IClassType;`
                    ]
                });
            }
            classMember.getMethod("getType").removeBody().addStatements(`return Type.get("${className}", "class") as IClassType;`);
        });
        await Promise.resolve(promiseList).then(() => {

        }).catch(err => {
            throw err;
        });
    }
    catch (e) {
        log(e, "error");
    }
}
const sourceFiles = args.src.split(",");
const generatedPath = args.genPath;
let sourceFileList = project.addExistingSourceFiles(sourceFiles);
eachSeries(sourceFileList, (sourceFile, callback) => {
    processSourceFile(sourceFile, generatedPath).then(() => {
        callback();
    }).catch(e => {
        callback(e);
    });
}, (err) => {
    project.save().then(() => {
        process.exit(0);
    }).catch(e => {
        process.exit(0);
    })
});
