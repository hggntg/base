import { Logger } from "@base/logger";
import { CustomWrap } from "./custom";

const logger = new Logger("main");
// setTimeout(() => {
//     logger.pushDebug('Timeout happened 1', "");
//     setTimeout(() => {
//         logger.pushDebug('Timeout happened 2', "");
//         setTimeout(() => {
//             logger.pushDebug('Timeout happened 3', "");
//         }, 0);
//         logger.pushDebug('Registered timeout 3', "");
//     }, 0);
//     logger.pushDebug('Registered timeout 2', "");
// }, 0)
// logger.pushDebug('Registered timeout 1', "");

// function a(){
//     logger.pushDebug("Ok 1?", "");
// }

// function b(){
//     logger.pushDebug("Ok 2?", "");
// }

// a();
// b();
let cus: CustomWrap = new CustomWrap();
cus.connect((a)=>{
    logger.pushDebug("Ayo a.k.a C.D.C", a);
});
cus.connect((a)=>{
    logger.pushDebug("Ayo a.k.a C.D.C", a);
});
// cus.connect((a)=>{
//     logger.pushDebug("Ayo a.k.a C.D.C", a);
// });
// cus.connect((a)=>{
//     logger.pushDebug("Ayo a.k.a C.D.C", a);
// });
// cus.connect((a)=>{
//     logger.pushDebug("Ayo a.k.a C.D.C", a);
// });
// cus.connect((a)=>{
//     logger.pushDebug("Ayo a.k.a C.D.C", a);
// });

setTimeout(() => {
    cus.disconnect();
}, 200);