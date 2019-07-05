import * as ts_module from "typescript/lib/tsserverlibrary";

function init(modules: { typescript: typeof ts_module }) {
  const ts = modules.typescript;
  
  function create(info: ts.server.PluginCreateInfo) {
    // Get a list of things to remove from the completion list from the config object.
    // If nothing was specified, we'll just remove 'caller'
    const whatToRemove: string[] = info.config.remove || ["caller"];

    // Diagnostic logging
    info.project.projectService.logger.info(
      "I'm getting set up now! Check the log for this message."
    );

    // Set up decorator
    const proxy: ts.LanguageService = Object.create(null);
    for (let k of Object.keys(info.languageService) as Array<
      keyof ts.LanguageService
    >) {
      proxy[k]
      const x = info.languageService[k];
      if(x){
        (<any>proxy[k]) = (...args: Array<{}>) => (<Function>x).apply(info.languageService, args);
      }
    }

    // Remove specified entries from completion list
    proxy.getCompletionsAtPosition = (fileName, position) => {
      const prior = info.languageService.getCompletionsAtPosition(fileName, position, {});
      if(prior){
        const oldLength = prior.entries.length;
        prior.entries = prior.entries.filter(e => whatToRemove.indexOf(e.name) < 0);
        // Sample logging for diagnostic purposes
        if (oldLength !== prior.entries.length) {
          const entriesRemoved = oldLength - prior.entries.length;
          info.project.projectService.logger.info(JSON.stringify(prior.entries[0]));
          info.project.projectService.logger.info(
            `Removed ${entriesRemoved} entries from the completion list`
          );
        }
        prior.entries.push({
          name: "getType",
          kind: ts_module.ScriptElementKind.memberFunctionElement,
          sortText: "getType",
          source: "return 'hello';"
        });
      }

      return prior;
    };

    return proxy;
  }

  return { create };
}

export = init;