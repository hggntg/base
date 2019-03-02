process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';

export * from "./domain";

process.on('unhandledRejection', (reason, promise) => {
    console.log(promise);
    console.log('Unhandled Rejection at:', reason.stack || reason);
});