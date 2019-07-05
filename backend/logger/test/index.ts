/// <reference path="../typings.d.ts" />
import { ILogger, LOGGER_SERVICE } from "../.generated/src";
import { getDependency } from "@base/class";
const logger: ILogger = getDependency(LOGGER_SERVICE);

logger.initValue({appName: "logger-1"});
logger.trace(true);
logger.pushInfo("Hello My Friend I'm comming back", "Test-Tag");

const logger2: ILogger = logger.expand();

logger2.initValue({appName: "logger-2"});
logger2.trace(true);
logger2.pushInfo("Hello His Friend", "Test-Tag2");