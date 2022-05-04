import { WebSocketManager } from "@guildedjs/ws";
import type { Request, Response } from "express";
import { nanoid } from "nanoid";
import fetch from "node-fetch";
import type { ConnectionStore } from "../typings";

export function build(connections: ConnectionStore) {
    return {
        spawnGateway: (req: Request, res: Response) => {
            const gateway = new WebSocketManager(req.body.wsOptions);
            const connectionId = nanoid(21);
            const { endpointURL } = req.body.options;
            gateway.connect();
            gateway.emitter.on("gatewayEvent", (event, data) =>
                fetch(endpointURL, { body: JSON.stringify({ event, data }) })
                    .then(() => console.log(`Successfully sent event ${event} to ${endpointURL}`))
                    .catch(console.error)
            );
            connections.set(connectionId, { wsOptions: req.body.wsOptions, ws: gateway, options: req.body.options });

            return res.status(200).json({ success: true, data: { connectionId } });
        },
        destroyGateway(req: Request, res: Response) {
            const connection = connections.get(req.params.connectionId);
            if (!connection) return res.status(404).json({ success: false, data: { message: "Connection does not exist" } });
            connection.ws.destroy();
            connections.delete(req.params.connectionId);

            return res.status(200).json({ success: true, data: {} });
        },
    };
}
