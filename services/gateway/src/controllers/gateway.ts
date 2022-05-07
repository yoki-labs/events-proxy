import { WebSocketManager, WebSocketOptions } from "@guildedjs/ws";
import type { PrismaClient } from "@prisma/client";
import type { Request, Response } from "express";
import { nanoid } from "nanoid";
import fetch from "node-fetch";
import type { ConnectionStore, Option } from "../typings";

export function build(connections: ConnectionStore, prisma: PrismaClient) {
    const createConnection = ({ botId, endpointURL, ownerId, token, authorization, optInEvents }: Option) => {
        const connectionId = nanoid(21);
        const gateway = new WebSocketManager({ token });
        gateway.connect();
        gateway.emitter.on("gatewayEvent", (event, data) => {
            // EVENT WAS NOT DESIRED
            if (!optInEvents.includes(event)) return;

            // EVENT WAS OPTED INTO
            fetch(endpointURL, {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: authorization || ""
                },
                body: JSON.stringify({ event, data: data.d }),
                method: "POST",
            })
                .then(() => console.log(`Successfully sent event ${event} to ${endpointURL}`))
                .catch(console.error);
        });
        return { connectionId, ws: gateway, options: { botId, endpointURL, ownerId, token, authorization } };
    };

    const spawnGateway = async (req: Request, res: Response) => {
        const existingConnection = await prisma.bot.findFirst({ where: { botId: req.body.botId } });
        if (existingConnection) return res.status(203).json({ success: false, data: { message: `Bot with ID: {${req.body.botId}} already has an existing connection.` } });

        const { connectionId, options, ws } = createConnection(req.body);
        await prisma.bot.create({ data: options });
        connections.set(connectionId, { options, ws });
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

    const getGateways = async (req: Request, res: Response) => {
        const storedConnections = await prisma.bot.findMany({ select: { botId: true, endpointURL: true } });
        const createdConnections = Array.from(connections.entries()).map(([connectionId, data]) => ({
            botId: data.options.botId,
            endpointURL: data.options.endpointURL,
            connectionId,
        }));
        return res.status(200).json({ storedConnections, createdConnections });
    };

    return { createConnection, spawnGateway, destroyGateway, getGateways };
}
