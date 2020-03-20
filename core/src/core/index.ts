if("undefined" === typeof global["system"]){
    const system: ISystem = {
        log: console.log,
        warn: console.warn,
        debug: console.debug,
        error: console.error,
        info: console.info
    }
    global["system"] = system;
}

import { join } from "path";
import BuiltInModule from "module";
import "./injection";
import "./property";
import "./class";
import "./namespace";
import "./logger";
import "./error";
import "./watcher";
import "./json.partial";
import "./object";

if ("undefined" === typeof global["addAlias"]) {
    const Module = module.constructor || BuiltInModule;
    const moduleAliasNames = [];
    const moduleAliases = {

    };

    global["addAlias"] = function addAlias(alias: string, target: string) {
        moduleAliases[alias] = target;
        if (!moduleAliasNames.includes(alias)) moduleAliasNames.push(alias);
    }

    global["isPathMatchesAlias"] = function isPathMatchesAlias(path: string, alias: string) {
        if (path.indexOf(alias) === 0) {
            if (path.length === alias.length) return true
            if (path[alias.length] === '/') return true
        }

        return false
    }

    const oldResolveFilename = (<any>Module)._resolveFilename;
    (<any>Module)._resolveFilename = function (request, parentModule, isMain, options) {
        for (var i = moduleAliasNames.length; i-- > 0;) {
            var alias = moduleAliasNames[i];
            if (isPathMatchesAlias(request, alias)) {
                var aliasTarget = moduleAliases[alias];
                if (typeof moduleAliases[alias] === 'function') {
                    let fromPath = parentModule.filename;
                    aliasTarget = moduleAliases[alias](fromPath, request, alias);
                    if (!aliasTarget || typeof aliasTarget !== 'string') {
                        throw new Error('[module-alias] Expecting custom handler function to return path.');
                    }
                }
                request = join(aliasTarget, request.substr(alias.length));
                break;
            }
        }
        return oldResolveFilename.call(this, request, parentModule, isMain, options)
    }
}