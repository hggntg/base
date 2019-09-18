import fs from "fs";
import path from "path";
const cwd = process.cwd();
const bundlePath = path.resolve(cwd, "bundle");
const copiedList = [
    { src : 'node_modules/swagger-ui-express/indexTemplate.html.tpl', dest: 'indexTemplate.html.tpl' },
    { src : 'node_modules/swagger-ui-express/swagger-ui-init.js.tpl', dest: 'swagger-ui-init.js.tpl'},
    { src : 'node_modules/swagger-ui-dist/swagger-ui.css', dest: 'swagger-ui.css' },
    { src : 'node_modules/swagger-ui-dist/swagger-ui-bundle.js', dest: 'swagger-ui-bundle.js' },
    { src : 'node_modules/swagger-ui-dist/swagger-ui-standalone-preset.js', dest: 'swagger-ui-standalone-preset.js' },
    { src : 'node_modules/swagger-ui-dist/favicon-16x16.png', dest: 'favicon-16x16.png' },
    { src : 'node_modules/swagger-ui-dist/favicon-32x32.png', dest: 'favicon-32x32.png' }
];
copiedList.map(copiedObject => {
    fs.copyFileSync(path.resolve(cwd, copiedObject.src), path.resolve(bundlePath, copiedObject.dest));
});
process.exit(0);