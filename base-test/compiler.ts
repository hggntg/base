import { Project, ts, Node, FileSystemHost, ClassDeclaration, createWrappedNode } from "ts-morph";
import EventEmitter from "events";
import sysPath from "path";
import queue from "queue";

import chokidar from "chokidar";
import shell from "shelljs";
import { ChildProcess } from "child_process";
import { corets } from "./assets/normal.corets";

interface IIntrinsicType{
    kind: "intrinsic";
    name: "string" | "number" | "any" | "void" | "number" | "object" | "array" | "boolean";
}

interface IPropertyType{
    kind: "property";
    name: string;
    type: IInterfaceType | IIntrinsicType;
    optional: boolean;
}

interface IMethodType{
    kind: "method";
    name: string;
    params: (IInterfaceType | IIntrinsicType)[];
    returnType: IIntrinsicType | IInterfaceType;
    optional: boolean;
}

interface IConstructorType{
    kind: "construct";
    name: string;
    params: (IInterfaceType | IIntrinsicType)[];
}

interface IClassType{
    kind: "class";
    name: string;
    properties: IPropertyType[];
    methods: IMethodType[];
    extend: IClassType;
    implements: IInterfaceType[];
    constructors: IConstructorType[];
}

interface IInterfaceType{
    kind: "interface";
    name: string;
    properties: IPropertyType[];
    methods: IMethodType[];
    extends:  IInterfaceType[];
}

const q = queue({
    autostart: true,
    concurrency: 1
});

export const mainEventSource = new EventEmitter();

interface IUpdateSourceFile {
    pos: number,
    text: string
}

interface IFileItem {
    path: string;
    status: "CHANGED" | "NOT_CHANGED";
}

interface IFileList {
    [key: string]: IFileItem;
}


let pending = false;
let timeout = 1000;
let lastChange = (+ new Date());
let isFirstTime = true;
let firstTimeStartServer = true;
let startServerProcess: ChildProcess = null;
let appPath: string = null;
let sourcePath: string = null;
let generatePath: string = null;
let bouncer: NodeJS.Timeout = null;
let watcher: chokidar.FSWatcher = null;
let fs: FileSystemHost = null;
let project: Project = null;



const fileList: IFileList = {};
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
            // console.log()
        }
        else {
            interfaceType.properties.push({ kind: "property", name: propertyName, optional: false, type: null});
        }
    });
    updates.push({
        pos: node.getEnd(),
        text: `\nType.declare(${JSON.stringify(interfaceType)});`
    });
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
            let classDeclaration: ClassDeclaration = node as ClassDeclaration;
            let className = classDeclaration.getName();
            let constructors: IConstructorType[] = [];
            classDeclaration.getConstructors().map((construct, index) => {
                let params: {name: string, type: string, optional: boolean}[] = [];
                construct.getParameters().map((parameter) => {
                    let type = parameter.getType().getText();
                    params.push({name: parameter.getName(), type: type, optional: parameter.isOptional()});
                });
                console.log(params);
                constructors.push({
                    kind: "construct",
                    name: `${className}.constructor.${index}`,
                    params: []
                });
            });
            let classType: IClassType = {
                kind: "class",
                name: className,
                constructors: constructors,
                extend: null,
                implements: [],
                methods: [],
                properties: []
            }
            updates.push({ pos: node.getEnd(), text: `\nType.declare(${JSON.stringify(classType)});`});
        }
    }
    else {
        if (node.getKind() === ts.SyntaxKind.InterfaceDeclaration) {
            getInterface(node, updates);
        }
        else if (node.getKind() === ts.SyntaxKind.ClassDeclaration) {
            let classDeclaration: ClassDeclaration = createWrappedNode(node.compilerNode) as ClassDeclaration;
            let className = classDeclaration.getName();
            let constructors: IConstructorType[] = [];
            classDeclaration.getConstructors().map((construct, index) => {
                let params: {name: string, type: string, optional: boolean}[] = [];
                construct.getParameters().map((parameter) => {
                    let type = parameter.getTypeNode().getText();
                    params.push({name: parameter.getName(), type: type, optional: parameter.isOptional()});
                });
                console.log(params);
                constructors.push({
                    kind: "construct",
                    name: `${className}.constructor.${index}`,
                    params: []
                })
            });
            let classType: IClassType = {
                kind: "class",
                name: className,
                constructors: constructors,
                extend: null,
                implements: [],
                methods: [],
                properties: []
            }
            updates.push({ pos: node.getEnd(), text: `\nType.delcare(${JSON.stringify(classType)});`});
        }
    }
}

function main(sourceFiles: string[], generatedPath, isFirstTime: boolean) {
    project.addExistingSourceFiles(sourceFiles).map(sourceFile => {
        sourceFile.refreshFromFileSystemSync();
        let srcIndex = sourceFile.getFilePath().indexOf("src");
        let filePath = sourceFile.getFilePath().substring(srcIndex, sourceFile.getFilePath().length);
        console.log("Generating " + filePath);
        let sourceRootDeclarations = sourceFile.getImportDeclarations();
        let importPaths = [];
        sourceRootDeclarations.map((sourceRootDeclaration) => {
            importPaths.push(sourceRootDeclaration.getModuleSpecifierValue());
        });
        let sourceRootExportations = sourceFile.getExportDeclarations();
        let exportPaths = [];
        sourceRootExportations.map((sourceRootExportation) => {
            exportPaths.push(sourceRootExportation.getModuleSpecifierValue());
        });

        let copiedSourceFile = sourceFile.copy(`${generatedPath}/${filePath}`, { overwrite: true });
        let declarations = copiedSourceFile.getImportDeclarations();
        declarations.map((declaration, index) => {
            if (importPaths[index] !== declaration.getModuleSpecifierValue()) {
                declaration.setModuleSpecifier(importPaths[index]);
            }
        });

        let exportations = copiedSourceFile.getExportDeclarations();
        exportations.map((exportation, index) => {
            if (exportPaths[index] !== exportation.getModuleSpecifierValue()) {
                exportation.setModuleSpecifier(exportPaths[index]);
            }
        });

        if (filePath === "src/index.ts") {
            copiedSourceFile.insertText(0, `import "./core.ts";\n`);
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
            classMember.addMethod({
                isStatic: true,
                name: "getType",
                returnType: "IClassType",
                statements: [
                    `return Type.get(getClass(this).name, "class") as IClassType;`
                ]
            });
            classMember.getMethod("getType").removeBody().addStatements(`return Type.get(getClass(this).name, "class") as IClassType;`);
        });
        Promise.resolve(promiseList).then(() => {

        }).catch(err => {
            console.error(err);
        });
    });
    if (isFirstTime) {
        fs.copy("tsconfig.json", `${generatedPath}/tsconfig.json`);
        let typingFile = fs.copy("typings.d.ts", `${generatedPath}/typings.d.ts`);
        typingFile.then(() => {
            fs.readFile(`${generatedPath}/typings.d.ts`, "utf8").then((value) => {
                let pattern = new RegExp(`\\${sysPath.sep}`, "g");
                let nodeModulePath = sysPath.join(appPath, "node_modules").replace(pattern, "/");
                value = value.replace(/node_modules/g, nodeModulePath);
                fs.writeFile(`${generatePath}/typings.d.ts`, value);
            });
        })
        project.createSourceFile(`${generatedPath}/src/core.ts`, corets, { overwrite: true });
    }
    return project.save();
}
mainEventSource.once("start", (_appPath: string) => {
    appPath = _appPath;
    sourcePath = sysPath.join(appPath, "src");
    project = new Project({
        tsConfigFilePath: sysPath.resolve(sysPath.join(appPath, "tsconfig.json"))
    });
    fs = project.getFileSystem(); 
    generatePath = sysPath.join(appPath, ".generated");
    bouncer = setInterval(() => {
        let current = (+ new Date());
        let diff = current - lastChange;
        if (diff >= timeout && diff < Math.floor(timeout * 2)) {
            if (!pending) {
                pending = true;
                mainEventSource.emit("change", isFirstTime);
                isFirstTime = false;
            }
        }
    }, 950);
    
    watcher = chokidar.watch(sourcePath, {
        persistent: true,
        interval: 1000,
        atomic: 1000
    });
    watcher.on('add', (path, stats) => {
        fileList[path] = { path: path, status: "CHANGED" };
        lastChange = (+new Date());
    }).on('change', (path, stats) => {
        fileList[path].status = "CHANGED";
        lastChange = (+ new Date());
    }).on('unlink', (path) => {
        q.push((callback) => {
            delete fileList[path];
            let generatedPath = sysPath.join(generatePath, path);
            project.removeSourceFile(project.getSourceFile(generatedPath));
            fs.delete(generatedPath).then(() => {
                return project.save().then(() => {
                    setTimeout(() => {
                        callback();
                    }, 1);
                });
            }).catch(err => {
                throw err;
            })
        });
    });
});

mainEventSource.on("change", (isFirstTime: boolean) => {
    let sourceFilePaths = [];
    Object.values(fileList).map(fileItem => {
        if (fileItem.status === "CHANGED") {
            sourceFilePaths.push(fileItem.path);
        }
    });
    console.log("Building........");
    main(sourceFilePaths, generatePath, isFirstTime).then(() => {
        Object.keys(fileList).map(key => {
            fileList[key].status = "NOT_CHANGED";
        });
        pending = false;
        console.log("Build done........");
        console.log("Waiting for changes.....");
        if(firstTimeStartServer){
            startServerProcess = shell.exec(`nodemon`, { async: true }) as ChildProcess;
            startServerProcess.unref();
            firstTimeStartServer = false;
        }
    }).catch(err => {
        throw err;
    });
});

process.on("SIGINT", () => {
    clearInterval(bouncer);
    watcher.close();
    mainEventSource.removeAllListeners();
    if (startServerProcess) startServerProcess.kill();
});

mainEventSource.emit("start", process.cwd());