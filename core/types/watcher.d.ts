type TWatcherEvent = "STOP"; 

declare interface IWatcher {
    emit(events: TWatcherEvent, id: string): void;
    init(): void;
    joinFrom(id: string): void;
}

declare module NodeJS {
    interface Process {
        watcher: IWatcher;
    }
}