import { App, UnitOfWork } from "@base/interfaces";
import { IExtendApi } from "./internal";
import express from "express";
import morgan from "morgan";
import { urlencoded, json } from "body-parser";
import { v1 } from "uuid";
import { getController, IController } from "./main/controller";

declare const app: App & IExtendApi;

app.server = express();

export * from "./main/controller";

app.startServer =  function (port: number, unitOfWorkInstance: UnitOfWork, controllers: {[key: string]: { new(unitOfWorkInstance: UnitOfWork) : IController} }) : Promise<boolean> {
    let namespace = app.context.create("dbContext");
    app.server.use(json({}));
    app.server.use(urlencoded({ extended: true }));
    app.server.use(morgan("combined"))
    app.server.use((req, res, next) => {
        namespace.run(async () => {
            namespace.set("tid", v1());
            next();
        }).catch((e) => {
            console.error(e);
        });

        res.once("finish", () => {
            namespace.dispose();
        });
    });
    Object.keys(controllers).map(controllerKey => {
        let classImp = controllers[controllerKey];
        let controller = new classImp(unitOfWorkInstance);
        let controllerProperty = getController(classImp);
        app.server.use(controllerProperty.routeBase, controller.subApp);
    });
    return new Promise((resolve, reject) => {
        app.server.listen(port, () => {
            resolve(true);
        })
        .once("error", (err) => {
            reject(err);
        });
    });
}
export * from "./internal";

// registerController(controllers){
//     if(this.type === "WebAPI"){
//         if(!this.route){
//             this.route = {
//                 base: null,
//                 controllers: {}
//             }
//         }
//         Object.keys(controllers).map(controllerKey => {
//             this.route.controllers[controllerKey] = controllers[controllerKey];
//         });
//     }
// }
// start(unitOfWork: UnitOfWorkAbs) {
//     let namespace = Namespace.create("dbContext");
//     if (this.type === "WebAPI") {
//         if(!this.route){
//             this.route = {
//                 base: express(),
//                 controllers: {}
//             }
//         }
//         if(!this.route.base){
//             this.route.base = express();
//         }
//         this.route.base.use(json({}));
//         this.route.base.use(urlencoded({extended: true}));
//         this.route.base.use(morgan("combined"))
//         this.route.base.use((req, res, next) => {
//             namespace.run(async () => {
//                 namespace.set("tid", uuidv1());
//                 next();
//             });
//             res.once("finish", () => {
//                 namespace.dispose();
//             });
//         });
//         Object.keys(this.route.controllers).map(controllerKey => {
//             let classImp = this.route.controllers[controllerKey];
//             let controller = new classImp(unitOfWork);
//             let controllerProperty = getController(classImp);
//             this.route.base.use(controllerProperty.routeBase, controller.subApp);
//         });
//         this.route.base.listen(3000, () => {
//             console.log(`
//             ---------------------------------------------------------------------
//             ---------------------------------------------------------------------
//             --------------------- Server start at port 3000 ---------------------
//             ---------------------------------------------------------------------
//             ---------------------------------------------------------------------
//             `);
//         });
//     }
//     else {

//     }
// }