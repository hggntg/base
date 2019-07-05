/// <reference path="../typings.d.ts" />
import {
    ICollection, IDatabaseContext, Entity, BaseEntity, DatabaseContext, DBContext, DCollection, AUnitOfWork, BaseRepository,
    RepositoryProperty, Field, UOW, DATABASE_CONTEXT_SERVICE, BASE_ENTITY_SERVICE, BASE_REPOSITORY_SERVICE, UNIT_OF_WORK_SERVICE,
    IUnitOfWork, COLLECTION_SERVICE
} from "../.generated/src";
import { LOGGER_SERVICE, ILogger, ILog } from "@base/logger";
import { Injectable, getDependency } from "@base/class";
interface ITest {
    test: string;
}

const mongooseConfig = {
    uri: "mongodb://localhost:27017/testdb",
    options: {
        connectTimeoutMS: 30000,
        keepAlive: true,
        poolSize: 10
    }
}

@Injectable(BASE_ENTITY_SERVICE, true)
@Entity<ITest>("test", {

}, function () {
    this.pre("init", function (next) {
        console.log("init");
        next();
    }).pre("save", function (next) {
        console.log("Before Save");
        next();
    });
    this.plugin(function a1123() {

    });
    this.pre("update", function (next) {
        console.log("update");
        next();
    })
})
class Test extends BaseEntity<ITest> implements ITest {

    @Field({ type: String })
    test: string;

    constructor() {
        super();
    }
}

@Injectable(DATABASE_CONTEXT_SERVICE, true, true)
@DBContext(mongooseConfig.uri, mongooseConfig.options)
class TestContext extends DatabaseContext {
    @DCollection<Test>(Test)
    public test: ICollection<Test> = getDependency<ICollection<Test>>(COLLECTION_SERVICE, true);
    constructor() {
        super();
        this.logger = getDependency<ILogger>(LOGGER_SERVICE);
    }
}

@Injectable(BASE_REPOSITORY_SERVICE, true)
class TestRepository extends BaseRepository<Test>{}

@Injectable(UNIT_OF_WORK_SERVICE, true, true)
@UOW()
class TestUOW extends AUnitOfWork {
    @RepositoryProperty(TestRepository)
    private test: TestRepository;
}

const logger: ILogger = getDependency<ILogger>(LOGGER_SERVICE);
logger.initValue({ appName: "database-test" });
logger.trace(true);
let context: IDatabaseContext = getDependency<IDatabaseContext>(DATABASE_CONTEXT_SERVICE);
context.createConnection().then(() => {
    let db: IUnitOfWork = getDependency<IUnitOfWork>(UNIT_OF_WORK_SERVICE);
    db.list<Test>("Test").insert({ test: "dmmay" });
    db.saveChanges().then(function () {
        logger.pushDebug(JSON.stringify({ id: 1, message: "Hello I'm iron man" }), "AvengeR");
    });
});