import jwt from "jsonwebtoken";

export interface IJwtObject {
    idt: string;
    prs: [];
    inf: {
        [key in string]: any
    };
    pub?: string;
    opt?: string;
    iat?: number;
    exp?: number;
}

export interface IJwToken {
    id: string;
    privateToken: string;
    publicToken: string;
    secret: string;
    info: IJwtObject;
    options: jwt.SignOptions;
    exp: number
};

export interface ITokenPair {
    publicToken: string;
    privateToken: string;
    secret: string;
    info: IJwtObject;
    options: jwt.SignOptions;
}

export interface ILogoutToken {
    token: string;
}

export interface IOutputToken {
    publicToken: string;
    privateToken: string;
}

export class LogoutToken implements ILogoutToken {
    @Property(String)
    token: string;
}

export class JwtObject implements IJwtObject {
    //token id
    @Property(String, { required: true })
    idt: string;
    //permissions
    @Property(Array, { required: true })
    prs: [];
    //information
    @Property(Object)
    inf: { [x: string]: any; };
    //public
    @Property(String)
    pub?: string;
    //option
    @Property(String)
    opt?: string;
    //issue at
    @Property(Number, { required: true })
    iat?: number;
    //expire
    @Property(Number, { required: true })
    exp?: number;

}

export class JwToken implements IJwToken {
    @Property(String, { required: true })
    id: string;

    @Property(String, { required: true })
    privateToken: string;
    
    @Property(String, { required: true })
    publicToken: string;

    @Property(String)
    secret: string;

    @Property(PropertyTypes.Any)
    options: jwt.SignOptions;

    @Property(Number, { required: true })
    exp: number;
    @Property(JwtObject)
    info: IJwtObject;
}

export class TokenPair implements ITokenPair {
    @Property(String)
    publicToken: string;    
    @Property(String)
    privateToken: string;
    @Property(String)
    secret: string;
    @Property(PropertyTypes.Any)
    options: jwt.SignOptions;
    @Property(JwtObject)
    info: IJwtObject;
}