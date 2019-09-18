import { Property } from "@base/class";

export interface IJwtObject {
    idt: string;
    prs: [];
    inf: {
        [key in string]: any
    }
    iat?: number;
    exp?: number;
}

export interface IJwToken {
    id: string;
    token: string
    exp: number
};

export interface ILogoutToken {
    token: string;
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
    @Property(Object)
    inf: { [x: string]: any; };
    @Property(Number, { required: true })
    iat?: number;
    @Property(Number, { required: true })
    exp?: number;

}

export class JwToken implements IJwToken {
    @Property(String, { required: true })
    id: string;

    @Property(String, { required: true })
    token: string;

    @Property(Number, { required: true })
    exp: number;
}
