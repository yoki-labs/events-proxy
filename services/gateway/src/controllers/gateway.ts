import { WebSocketManager, WebSocketOptions } from "@guildedjs/ws";
import type { PrismaClient } from "@prisma/client";
import type { Request, Response } from "express";
import { nanoid } from "nanoid";
import fetch from "node-fetch";
import type { ConnectionStore, Option } from "../typings";

export function build(connections: ConnectionStore, prisma: PrismaClient) {
    const createConnection = ({ botId, endpointURL, ownerId, token }: Option) => {
        const connectionId = nanoid(21);
        const gateway = new WebSocketManager({ token });
        gateway.connect();
        gateway.emitter.on("gatewayEvent", (event, data) => {
            fetch(endpointURL, {
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                body: JSON.stringify({ event, data: data.d }),
                method: "POST",
            })
                .then(() => console.log(`Successfully sent event ${event} to ${endpointURL}`))
                .catch(console.error);
        });
        return { connectionId, ws: gateway, options: { botId, endpointURL, ownerId, token } };
    };

    const spawnGateway = async (req: Request, res: Response) => {
        const { connectionId, options, ws } = createConnection(req.body);
        await prisma.bot.create({ data: options });
        connections.set(connectionId, { ...options, ws });
        return res.status(200).json({ success: true, data: { connectionId } });
    };

    const destroyGateway = async (req: Request, res: Response) => {
        const connection = connections.get(req.params.connectionId);
        if (!connection) return res.status(404).json({ success: false, data: { message: "Connection does not exist" } });
        connection.ws.destroy();
        connections.delete(req.params.connectionId);
        await prisma.bot.deleteMany({ where: { botId: req.body.botId } });

        return res.status(200).json({ success: true, data: {} });
    };

    return { createConnection, spawnGateway, destroyGateway };
}
