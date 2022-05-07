import type { WebSocketManager, WebSocketOptions } from "@guildedjs/ws";

export interface Connection {
    ws: WebSocketManager;
    options: Option;
}
export interface Option {
    token: string;
    botId: string;
    endpointURL: string;
    ownerId: string;
    authorization: string;
}

export type ConnectionStore = Map<string, Connection>;
