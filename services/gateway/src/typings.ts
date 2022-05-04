import type { WebSocketManager, WebSocketOptions } from "@guildedjs/ws";

export interface Connection {
    ws: WebSocketManager;
    wsOptions: WebSocketOptions;
    options: {
        endpointURL: string;
    };
}

export type ConnectionStore = Map<string, Connection>;
