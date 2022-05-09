import type { Worker } from "worker_threads";

export interface Connection {
    worker: Worker;
    options: Option;
    connectionId: string;
}
export interface Option {
    token: string;
    botId: string;
    endpointURL: string;
    ownerId: string;
}
export enum WorkerMessage {
    PostData = 0,
    DeleteGateway,
}

export type ConnectionStore = Map<string, Connection>;
