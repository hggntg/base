
import { Entity, BaseEntity, DatabaseContext, DBContext, DCollection, AUnitOfWork, BaseRepository, RepositoryProperty, Field, UOW } from "../src";
import { ICollection, IDatabaseContext } from "@base-interfaces/database";
import { Logger } from "@base/logger";
interface ITest {
    test: string;
}

let logger = new Logger("test-database");
logger.trace(false);

const mongooseConfig = {
    uri: "mongodb://localhost:27017/testdb",
    options: {
        connectTimeoutMS: 30000,
        keepAlive: true,
        poolSize: 10
    }
}

let anotherLogger = logger.expand();
anotherLogger.trace(true);

@Entity<ITest>("test", {

}, function () {
    this.pre("init", function (next) {
        console.log("init");
        next();
    }).pre("save", function (next) {
        next();
    });
    this.plugin(function a1123() {

    });
    this.pre("update", function (next) {
        console.log("update");
        next();
    });
}, logger)
class Test extends BaseEntity<ITest> implements ITest {

    @Field({ type: String })
    test: string;

    constructor() {
        super();
    }
}

@DBContext(mongooseConfig.uri, mongooseConfig.options, anotherLogger)
class TestContext extends DatabaseContext {
    @DCollection<Test>(Test, logger)
    public test: ICollection<Test>;
    constructor() {
        super();
    }
}

class TestRepository extends BaseRepository<Test>{
    constructor(_collection: ICollection<Test>) {
        super(_collection);
    }
}

@UOW(logger)
class TestUOW extends AUnitOfWork {
    @RepositoryProperty(TestRepository)
    private test: TestRepository;

    constructor(_dbContext: IDatabaseContext) {
        super(_dbContext);
    }
}

let context = new TestContext();
context.createConnection().then(() => {
    let db = new TestUOW(context);
    db.list<Test>("Test").insert({ test: "dmmay"});
    db.saveChanges().then(() => {
        logger.pushDebug(JSON.stringify({id: 1, message: "Hello I'm iron man"}), "AvengeR");
    });
});