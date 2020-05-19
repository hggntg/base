import mongoose from "mongoose";
export const EVENT_STORE_SERVICE = "IEventStore";

export interface IMetadata {
    entityId?: mongoose.Types.ObjectId;
    at?: Date;
    by: string;
    entity: string;
    event: "INSERT" | "UPDATE" | "REMOVE";
    metadata: any;
}

export interface IEventStore {
    write(data: IMetadata): Promise<void>;
    read(id: mongoose.Types.ObjectId): Promise<IMetadata>;
    start(uri: string, options: mongoose.ConnectionOptions): Promise<void>;
}

@Injectable(EVENT_STORE_SERVICE, false)
export class EventStore implements IEventStore {
    private eventStoreConnection: mongoose.Connection;
    private metadataEntity: mongoose.Model<mongoose.Document & IMetadata>;
    private isInit: boolean;
    start(uri: string, options: mongoose.ConnectionOptions): Promise<void> {
        if (!this.isInit) {
            return mongoose.createConnection(uri, options).then((connection) => {
                this.eventStoreConnection = connection;
                this.metadataEntity = connection.model("Metadata", new mongoose.Schema({
                    entityId: { type: mongoose.Types.ObjectId },
                    at: { type: Date, default: new Date() },
                    by: { type: String },
                    entity: { type: String },
                    event: { type: String },
                    metadata: { type: String }
                }, { _id: true }));
                this.isInit = true;
                return Promise.resolve();
            });
        }
        return Promise.resolve();
    }
    write(data: IMetadata | IMetadata[]): Promise<void> {
        if (Array.isArray(data)) {
            data = data.map(d => {
                d.metadata = JSON.stringify(d.metadata);
                return d;
            })
            return this.metadataEntity.insertMany(data).then(() => {
                return Promise.resolve();
            });
        }
        else {
            data.metadata = JSON.stringify(data.metadata);
            return this.metadataEntity.create(data).then(() => {
                return Promise.resolve();
            });
        }
    }
    read(id: mongoose.Types.ObjectId): Promise<IMetadata> {
        return this.metadataEntity.findOne({ _id: id }).then((metadata) => {
            let metadataEntity: IMetadata = {
                entityId: metadata.entityId,
                at: metadata.at,
                by: metadata.by,
                entity: metadata.entity,
                event: metadata.event,
                metadata: JSON.parse(metadata.metadata || "{}")
            }
            return metadataEntity;
        });
    }
}