import { Project, ts, Node, FileSystemHost } from "ts-morph";
import EventEmitter from "events";
import sysPath from "path";
import queue from "queue";

import chokidar from "chokidar";
import shell from "shelljs";
import { ChildProcess } from "child_process";
import { corets } from "../assets/normal.corets";
import { log } from "../../../infrastructure/logger";

import fsNode from "fs";

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
let isRun: boolean = false;
let isLive: boolean = false;
let typeDeclares: (IInterfaceType | IClassType)[] = [];
let typeDeclareIndexes = [];

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

function main(sourceFiles: string[], generatedPath, isFirstTime: boolean) {
    project.addExistingSourceFiles(sourceFiles).map(sourceFile => {
        sourceFile.refreshFromFileSystemSync();
        let srcIndex = sourceFile.getFilePath().indexOf("src");
        let filePath = sourceFile.getFilePath().substring(srcIndex, sourceFile.getFilePath().length);
        try {
            let destPath = `${generatedPath}/${filePath}`;
            if (fs.fileExistsSync(destPath)) {
                fs.deleteSync(destPath);
            }
            let copiedSourceFile = sourceFile.copy(destPath, { overwrite: true });
            log("Generating " + filePath);
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

            if (filePath === "src/index.ts") {
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
                classMember.addMethod({
                    isStatic: true,
                    name: "getType",
                    returnType: "IClassType",
                    statements: [
                        `return Type.get("${className}", "class") as IClassType;`
                    ]
                });
                classMember.getMethod("getType").removeBody().addStatements(`return Type.get("${className}", "class") as IClassType;`);
            });
            Promise.resolve(promiseList).then(() => {

            }).catch(err => {
                throw err;
            });
        }
        catch (e) {
            log(e, "error");
        }
    });
    if (isFirstTime) {
        if(fsNode.existsSync("tsconfig.json")){
            fsNode.copyFileSync("tsconfig.json", `${generatedPath}/tsconfig.json`)
        }
        if(fsNode.existsSync("typings.d.ts")){
            fsNode.copyFileSync("typings.d.ts", `${generatedPath}/typings.d.ts`);
        }
        if(fsNode.existsSync(".env")){
           fsNode.copyFileSync(".env", `${generatePath}/.env`);
        }
        project.createSourceFile(`${generatedPath}/src/core.ts`, corets, { overwrite: true });
    }
    let typeDeclareText = "";
    typeDeclares.map((typeDeclare) => {
        typeDeclareText += `Type.declare(${JSON.stringify(typeDeclare)});\n`;
    });
    fsNode.writeFileSync(`${generatedPath}/src/declare.ts`, typeDeclareText, { encoding: "utf8" });
    return project.save();
}
mainEventSource.once("start", (_appPath: string, _isRun: boolean, _isLive: boolean) => {
    isRun = _isRun;
    isLive = _isLive;
    if (isRun) {
        isLive = true;
    }
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
            if (isLive) {
                if (!pending) {
                    pending = true;
                    mainEventSource.emit("change", isFirstTime);
                    isFirstTime = false;
                }
            }
            else {
                mainEventSource.emit("change", isFirstTime);
                clearInterval(bouncer);
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
    log("Ready to generate source files........");
    main(sourceFilePaths, generatePath, isFirstTime).then(() => {
        Object.keys(fileList).map(key => {
            fileList[key].status = "NOT_CHANGED";
        });
        pending = false;
        log("Generating done........");
        if (isLive) {
            log("Waiting for changes.....");
            if (firstTimeStartServer && isRun) {
                log("Starting to run app");
                startServerProcess = shell.exec(`nodemon`, { async: true }) as ChildProcess;
                startServerProcess.unref();
                firstTimeStartServer = false;
            }
        }
        else {
            process.exit(0);
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
})