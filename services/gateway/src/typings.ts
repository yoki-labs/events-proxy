import type { WebSocketManager, WebSocketOptions } from "@guildedjs/ws";
import type { Worker } from "worker_threads";

export interface Connection {
    worker: Worker;
    options: Option;
}
export interface Option {
    token: string;
    botId: string;
    endpointURL: string;
    ownerId: string;
}

export type ConnectionStore = Map<string, Connection>;
