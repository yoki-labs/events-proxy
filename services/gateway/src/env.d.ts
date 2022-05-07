// add env variables typing to process.env
declare namespace NodeJS {
    export interface ProcessEnv {
        SERVER_PORT: string;
        TOKEN_SECRET: string;
    }
}
