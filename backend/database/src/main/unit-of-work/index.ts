import { getUnitOfWorkMetadata } from "@app/main/unit-of-work/decorator";
import {
	IDatabaseContext,
	IBaseEntity,
	IBaseRepository,
	IUnitOfWork,
	IEntityUIList,
	IUnitOfWorkUI
} from "@app/interface";
import { DATABASE_CONTEXT_SERVICE } from "@app/main/database-context";
import { getEntityUIList, getUnitOfWorkUI } from "@app/main/entity";
import { UI_KEY } from "@app/infrastructure/constant";
import express, { Express } from "express";
// import cookieParser from "cookie-parser";
import path from "path";
import { Transform } from "stream";
import { exists, createReadStream } from "fs";
// import socketIO from "socket.io";

// const mapData = function (keys: string[], value: any[]) {
// 	return new Transform({
// 		transform(chunk, encoding, callback) {
// 			let str = chunk.toString();
// 			keys.map((key, index) => {
// 				let pattern = new RegExp(key, "g");
// 				str = str.replace(pattern, value[index]);
// 			})
// 			this.push(str, "utf-8");
// 			callback();
// 		}
// 	});
// }

interface IModelUI {
	slug: string;
	name: string;
	itemCounts: number;
}

// function route(socket, uowUI: IUnitOfWorkUI ,data: IModelUI[]) {
// 	socket.on("get/module/list", function () {
// 		socket.emit("response/get/module/list:success", data);
// 	});
// 	data.map(d => {
// 		socket.on(`get/module/${d.slug}`, function(){
// 			let listName = uowUI.repositories[d.slug];
// 			let repo = uowUI.uow.list(listName);
// 			repo.find().then(modelResult => {
// 				socket.emit(`response/get/module/${d.slug}:success`, modelResult.value);
// 			}).catch(e => {
// 				socket.emit(`resposne/get/module/${d.slug}:error`, e.message);
// 			});
// 		});
// 		socket.on(`get/module/${d.slug}/detail`, function(id: string){
// 			let listName = uowUI.repositories[d.slug];
// 			let repo = uowUI.uow.list(listName);
// 			repo.where({id: id}).findOne().then(modelResult => {
// 				socket.emit(`response/get/module/${d.slug}/${id}:success`, modelResult.value[0]);
// 			}).catch(e => {
// 				socket.emit(`resposne/get/module/${d.slug}/${id}:error`, e.message);
// 			});
// 		});
// 	});
// 	socket.on("login", function (userData) {
// 		if (userData.email && userData.password) {
// 			if (userData.email !== "hggntg@gmail.com" || userData.password !== "admin123") {
// 				socket.emit("join:error", "Email or password is invalid");
// 			}
// 			else {
// 				let id = "THIS_WILL_BE_A_TOKEN";
// 				socket.emit("join:success", id);
// 			}
// 		}
// 		else {
// 			socket.emit("join:error", "Missing email or password");
// 		}
// 	});
// 	socket.on('disconnect', function () {
// 		console.log(`${this.id} disconnect from the server`);
// 		unRoute(this, "login");
// 		unRoute(this, "get/module/list");
// 		data.map(d => {
// 			unRoute(this, `get/module/${d.slug}`);
// 		});
// 	});
// }

// function sendFile(path: string, keys: string[], value: any[], res) {
// 	return exists(path, (exists) => {
// 		if (exists) {
// 			let reader = createReadStream(path, { encoding: "utf-8" });
// 			reader.pipe(mapData(keys, value)).pipe(res);
// 		}
// 		else {
// 			res.status(404).end();
// 		}
// 	});
// }

// function off(socket, event) {
// 	socket.off(event, function () {
// 		console.log(`${socket.id} off ${event}`);
// 	})
// }

// function unRoute(socket, key: string) {
// 	off(socket, key);
// }

export const UNIT_OF_WORK_SERVICE = "IUnitOfWork";

@Injectable(UNIT_OF_WORK_SERVICE, true, true)
export abstract class AUnitOfWork implements IUnitOfWork {
	protected logger: ILogger;
	protected dbContext: IDatabaseContext;
	private viewInstance: Express;
	constructor() {
		this.logger = getDependency<ILogger>(LOGGER_SERVICE);
		let unitOfWorkMetadata = getUnitOfWorkMetadata(this);
		this.dbContext = getDependency<IDatabaseContext>(DATABASE_CONTEXT_SERVICE, unitOfWorkMetadata.databaseContext.name);
		let entityUIList: IEntityUIList = getEntityUIList(getClass(this.dbContext));
		let unitOfWorkUI: IUnitOfWorkUI = getUnitOfWorkUI(getClass(this));
		unitOfWorkUI.uow = this;
		defineMetadata(UI_KEY, entityUIList, getClass(this.dbContext));
		defineMetadata(UI_KEY, unitOfWorkUI, getClass(this));
	}
	getContext(): IDatabaseContext {
		return this.dbContext;
	}
	list<K, T extends IBaseEntity<K>>(name: string): IBaseRepository<K, T> {
		let firstChar = name[0].toLowerCase();
		let realName = name.replace(name[0], firstChar);
		return this[realName];
	}
	saveChanges() {
		return this.dbContext.saveChanges();
	}

	// exposeUI(mode: "standalone" | "attachment", publicFolder: string, arg0?: string | number | socketIO.Server, arg1?: socketIO.Server): Promise<Express> {
	// 	return new Promise(async (resolve, reject) => {
	// 		let rootPath = "";
	// 		let columns: {
	// 			[key: string]: string[]
	// 		} = {};
	// 		let port = 0;
	// 		let io: socketIO.Server;
	// 		if (typeof arg0 === "string") {
	// 			rootPath = arg0;
	// 		}
	// 		else if (typeof arg0 === "number") {
	// 			port = arg0 as number;
	// 		}
	// 		else {
	// 			io = arg0;
	// 		}
	// 		if (arg1) {
	// 			io = arg1;
	// 		}
	// 		let baseHref = rootPath + "/";
	// 		if (!this.viewInstance) {
	// 			this.viewInstance = express();
	// 			this.viewInstance.use(cookieParser(), (req, res, next) => {
	// 				let token = req.cookies ? req.cookies.token : undefined;
	// 				if (token) {
	// 					(<any>req).token = token;
	// 				}
	// 				next();
	// 			});
	// 			this.viewInstance.use("/js", (req, res) => {
	// 				let filePath = path.join(publicFolder, req.url);
	// 				res.sendFile(filePath);
	// 			});
	
	// 			this.viewInstance.use("/css", (req, res) => {
	// 				let filePath = path.join(publicFolder, req.url);
	// 				res.sendFile(filePath);
	// 			});
	// 			this.viewInstance.get("/login", (req, res) => {
	// 				let token = req.cookies ? req.cookies.token : undefined;
	// 				if (token && token === "THIS_WILL_BE_A_TOKEN") {
	// 					res.redirect(`${rootPath}/`);
	// 				}
	// 				else {
	// 					let filePath = path.join(publicFolder, "views", "login.html");
	// 					sendFile(filePath, ["%%BASE_HREF%%"], [baseHref], res);
	// 				}
	// 			});
	// 			this.viewInstance.get("/:module", (req, res) => {
	// 				let token = req.cookies ? req.cookies.token : undefined;
	// 				if (token && token === "THIS_WILL_BE_A_TOKEN") {
	// 					let filePath = path.join(publicFolder, "views", "list.html");
	// 					let slug = req.params.module;
	// 					console.log(columns);
	// 					let columnString = JSON.stringify(columns[slug]);
	// 					sendFile(filePath, ["%%BASE_HREF%%", "%%BASE_MODEL%%", "%%MODEL_FIELDS%%"], [baseHref, slug, columnString], res);
	// 				}
	// 				else {
	// 					res.redirect(`${rootPath}/login`);
	// 				}
	// 			});
	
	// 			this.viewInstance.get("/:module/:id", (req, res) => {
	// 				let token = req.cookies ? req.cookies.token : undefined;
	// 				if (token && token === "THIS_WILL_BE_A_TOKEN") {
	// 					let filePath = path.join(publicFolder, "views", "detail.html");
	// 					sendFile(filePath, ["%%BASE_HREF%%"], [baseHref], res);
	// 				}
	// 				else {
	// 					res.redirect(`${rootPath}/login`);
	// 				}
	// 			});
	
	// 			this.viewInstance.get("/", (req, res) => {
	// 				let token = req.cookies ? req.cookies.token : undefined;
	// 				if (token && token === "THIS_WILL_BE_A_TOKEN") {
	// 					let filePath = path.join(publicFolder, "views", "home.html");
	// 					sendFile(filePath, ["%%BASE_HREF%%"], [baseHref], res);
	// 				}
	// 				else {
	// 					res.redirect(`${rootPath}/login`);
	// 				}
	// 			});
	// 			if (mode === "standalone") {
	// 				if (!port) {
	// 					throw new Error("Missing port for database ui standalone mode");
	// 				}
	// 				else {
	// 					this.viewInstance.listen(port, function () {
	// 						console.log("Database UI served on port " + port);
	// 					});
	// 				}
	// 			}
	// 		}
	// 		if (io) {
	// 			let dataNamespace = io.of("/data");
	// 			let that = this;
	// 			let entityUIList: IEntityUIList = getEntityUIList(getClass(that.dbContext));
	// 			let unitOfWorkUI: IUnitOfWorkUI = getUnitOfWorkUI(getClass(this));
	// 			unitOfWorkUI.entityUIList = entityUIList;
	// 			let entityKeys = Object.keys(entityUIList.entities);
	// 			let data: IModelUI[] = [];
	// 			let entityKeyLength = entityKeys.length;
	// 			let promiseList = [];
	// 			for (let i = 0; i < entityKeyLength; i++) {
	// 				let entity = entityUIList.entities[entityKeys[i]];
	// 				if(entity.name && entity.slug){
	// 					let slug = entity.slug;
	// 					columns[slug] = entity.columns;
	// 					let listName = unitOfWorkUI.repositories[slug];
	// 					promiseList.push(new Promise((innerResolve, innerReject) => {
	// 						let modelInfo: IModelUI = { name: entity.name, slug: entity.slug, itemCounts: 0 };
	// 						unitOfWorkUI.uow.list(listName).find().count().then(count => {
	// 							modelInfo.itemCounts = count;
	// 							data.push(modelInfo);
	// 							innerResolve();
	// 						}).catch(e => {
	// 							innerReject(e);
	// 						})
	// 					}));
	// 				}
	// 			}
	// 			Promise.all(promiseList).then(() => {
	// 				dataNamespace.on('connection', function (socket) {
	// 					console.log(`${socket.id} connect to the server`);
	// 					route(socket, unitOfWorkUI, data);
	// 				});
	// 				resolve(that.viewInstance);
	// 			}).catch(e => {
	// 				console.error(e.message);
	// 				reject(e);
	// 			});
	// 		}
	// 		else {
	// 			resolve(this.viewInstance);
	// 		}
	// 	});
	// }
}

export * from "@app/main/unit-of-work/decorator";
export * from "@app/main/unit-of-work/repository";
