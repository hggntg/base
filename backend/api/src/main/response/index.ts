export interface ResponseBody {
    code: number;
    status: string;
    message?: string;
    result?: ResponseResult;
    error?: ResponseError;
}

interface ErrorBodyInput{
    stack: string;
}
interface ResponseResult {
    type?: "single" | "list" | "empty";
    value: any[];
    page: number;
    end: boolean;
    numOfRecords: number;
    total: number;
}
interface ResponseError{
    stack: string;
}
export const HttpCode = {
    "200": "Ok",
    "201": "Created",
    "202": "Accepted",
    "204": "NoContent",
    "206": "PartialContent",
    "301": "MovedPermanently",
    "302": "Found",
    "307": "TemporaryRedirect",
    "308": "PermanentRedirect",
    "400": "BadRequest",
    "401": "Unauthorized",
    "403": "Forbidden",
    "404": "NotFound",
    "405": "MethodNotAllowed",
    "406": "NotAcceptable",
    "408": "RequestTimeout",
    "409": "Conflict",
    "500": "InternalServerError",
    "502": "BadGateway",
    "503": "ServiceUnavailable",
    "504": "GatewayTimeout"
};
const HttpResponseCode: { [key: string]: ResponseBody } = {
    Ok: { code: 200, status: "ok" },
    Created: { code: 201, status: "created" },
    Accepted: { code: 202, status: "accepted" },
    NoContent: { code: 204, status: "no content" },
    PartialContent: { code: 206, status: "partial content" },
    MovedPermanently: { code: 301, status: "moved permanently" },
    Found: { code: 302, status: "found" },
    TemporaryRedirect: { code: 307, status: "temporary redirect" },
    PermanentRedirect: { code: 308, status: "permanent redirect" },
    BadRequest: { code: 400, status: "bad request" },
    Unauthorized: { code: 401, status: "unauthorized" },
    Forbidden: { code: 403, status: "forbidden" },
    NotFound: { code: 404, status: "not found" },
    MethodNotAllowed: { code: 405, status: "method not allowed" },
    NotAcceptable: { code: 406, status: "not acceptable" },
    RequestTimeout: { code: 408, status: "request timeout" },
    Conflict: { code: 409, status: "conflict" },
    InternalServerError: { code: 500, status: "internal server error" },
    BadGateway: { code: 502, status: "bad gateway" },
    ServiceUnavailable: { code: 503, status: "service unavailable" },
    GatewayTimeout: { code: 504, status: "gateway timeout" }
};

function generateResponse(code: number, specificCode: number, message: string, type: "error" | "success" = "success", body?: ResponseResult | ErrorBodyInput): ResponseBody {
    let httpCode = HttpCode[code.toString()];
    let httpResponseCode = Object.__base__clone<ResponseBody>(HttpResponseCode[httpCode]);
    httpResponseCode.message = message;
    httpResponseCode.code = specificCode;
    if (body) {
        if(type === "success"){
            let resultBody = body as ResponseResult;
            if(!resultBody.value){
                resultBody.value = [];
            }
            if(resultBody.value.length === 0) resultBody.type = "empty";
            else if(resultBody.value.length === 1) resultBody.type = "single";
            else if(resultBody.value.length > 1) resultBody.type = "list";
            httpResponseCode.result = resultBody;
        }
        else{
            let errorBody = body as ErrorBodyInput;
            httpResponseCode.error = errorBody;
        }
    }
    return httpResponseCode;
}

export class ResponseTemplate {
    static success(code: number, message: string, body?: ResponseResult): ResponseBody;
    static success(code: number, specificCode: number, message: string, body?: ResponseResult): ResponseBody;
    static success(arg0: number, arg1: string | number, arg2: string | ResponseResult, arg3?: ResponseResult): ResponseBody {
        let code = arg0;
        let message = typeof arg1 === "string" ? arg1 as string : arg2 as string; 
        let specificCode = typeof arg1 === "number" ? arg1 as number : code;
        let body = (arg2 && typeof arg2 === "object") ? arg2 as ResponseResult : ((arg3 && typeof arg3 === "object") ? arg3 as ResponseResult : undefined);
        if (code >= 200 && code < 400) {
            return generateResponse(code, specificCode, message, "success", body);
        }
        else {
            return generateResponse(500, specificCode, "Internal server error", "error");
        }
    }
    static error(errorInput: IBaseError | Error): ResponseBody {
        let error = handleError(errorInput);
        if (error.code >= 400) {
            if(process.env["NODE_ENV"] !== "production"){
                return generateResponse(error.code, error.specificCode, error.message, "error", {stack: error.stack});
            }
            else{
                return generateResponse(error.code, error.specificCode, error.message, "error");
            }
        }
        else {
            if(process.env["NODE_ENV"] !== "production"){
                return generateResponse(error.code, error.specificCode, error.message, "error", {stack: error.stack});
            }
            else{
                return generateResponse(error.code, error.specificCode, error.message, "error");
            }
        }
    }
}