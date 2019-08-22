export const indexts = 
`import app from "./main";
app.start().then(() => {
    app.log("Hello I'm base project");
}).catch(e => {
    app.error(e);
});`