import type { PrismaClient } from "@prisma/client";
import type { Request, Response } from "express";
import { nanoid } from "nanoid";
import fetch from "node-fetch";
import { join } from "path";
import { Worker } from "worker_threads";
import { ConnectionStore, Option, WorkerMessage } from "../typings";

export function build(connections: ConnectionStore, prisma: PrismaClient) {
    const createConnection = ({ botId, endpointURL, ownerId, token }: Option) => {
        const connectionId = nanoid(21);
        const worker = new Worker(join(__dirname, "..", "workers", "Gateway.js"), { workerData: { token } });
        worker.on("message", ({ type, event, data }) => {
            if (type === WorkerMessage.PostData) {
                fetch(endpointURL, {
                    headers: { Accept: "application/json", "Content-Type": "application/json" },
                    body: JSON.stringify({ event, data: data.d }),
                    method: "POST",
                })
                    .then(() => console.log(`Successfully sent event ${event} to ${endpointURL} (${botId})`))
                    .catch(console.error);
            }
        });
        worker.on("error", console.log);
        return { connectionId, worker, options: { botId, endpointURL, ownerId, token } };
    };

    const spawnGateway = async (req: Request, res: Response) => {
        const existingConnection = await prisma.bot.findFirst({ where: { botId: req.body.botId } });
        if (existingConnection) return res.status(418).json({ success: false, data: { message: `Bot with ID: {${req.body.botId}} already has an existing connection.` } });

        const { connectionId, options, worker } = createConnection(req.body);
        await prisma.bot.create({ data: options });
        connections.set(connectionId, { options, worker });
        return res.status(200).json({ success: true, data: { connectionId } });
    };

    const destroyGateway = async (req: Request, res: Response) => {
        const connection = connections.get(req.params.connectionId);
        if (!connection) return res.status(404).json({ success: false, data: { message: "Connection does not exist" } });

        try {
            connection.worker.postMessage({ type: 1 });
            connection.worker.removeAllListeners();
            await connection.worker.terminate();
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

    return { createConnection, spawnGateway, destroyGateway, getGateways };
}
