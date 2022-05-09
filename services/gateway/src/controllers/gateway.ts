import type { PrismaClient } from "@prisma/client";
import type { Request, Response } from "express";
import fetch, { Response as HTTPResponse } from "node-fetch";
import type { ConnectionStore } from "../typings";
import { RequestType } from "../util";
import { createConnection, destroyConnection } from "./connection";

export function build(connections: ConnectionStore, prisma: PrismaClient) {
    const spawnGateway = async (req: Request, res: Response) => {
        const existingConnection = await prisma.bot.findFirst({ where: { botId: req.body.botId } });
        if (existingConnection) return res.status(418).json({ success: false, data: { message: `Bot with ID: {${req.body.botId}} already has an existing connection.` } });

        const { connectionId, options, worker } = createConnection(req.body);
        await prisma.bot.create({ data: options });
        connections.set(connectionId, { options, worker, connectionId });
        return res.status(200).json({ success: true, data: { connectionId } });
    };

    const runPonger = () => {
        const promises: Array<[string, Promise<HTTPResponse | null>]> = [];
        for (const [connectionId, connection] of connections.entries()) {
            promises.push([
                connectionId,
                fetch(connection.options.endpointURL, {
                    method: "POST",
                    body: JSON.stringify({ type: RequestType.PING }),
                }).catch(() => null),
            ]);
        }
        return promises;
    };

    const destroyGateway = async (req: Request, res: Response) => {
        const connection = connections.get(req.params.connectionId);
        if (!connection) return res.status(404).json({ success: false, data: { message: "Connection does not exist" } });

        try {
            await destroyConnection(connection);
        } catch (e) {
            return res.status(500).json({ success: false, data: { message: "There was an error terminating gateway worker." } });
        }

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

    return { createConnection, spawnGateway, destroyGateway, getGateways, runPonger };
}
