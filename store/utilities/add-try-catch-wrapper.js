"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function addTryCatchWrapper(ClassImp, funcName) {
    var func = ClassImp.prototype[funcName];
    var funcString = func.toString();
    var paramsString = funcString.split("(")[1].split(")")[0];
    var expression = "ClassImp.prototype[\"" + funcName + "\"] = function " + funcName + "(" + paramsString + "){\n\t\ttry{\n\t\t\treturn func.apply(this, arguments);\n\t\t}\n\t\tcatch(e){\n\t\t\tconsole.error(e);\n\t\t}\n\t}";
    eval(expression);
}
exports.addTryCatchWrapper = addTryCatchWrapper;
