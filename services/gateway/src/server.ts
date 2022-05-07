import { PrismaClient } from "@prisma/client";
import express from "express";
import { build as buildGatewayFunctions } from "./controllers/gateway";
import type { Connection, Option } from "./typings";
import { authenticateToken, validateOptions } from "./util";

const app = express();
const prisma = new PrismaClient();
const connections = new Map<string, Connection>();
const gatewayFunctions = buildGatewayFunctions(connections, prisma);

app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(express.json());

app.get("/", (req, res) => res.json({ success: true, data: { message: "Server is alive!" } }));

app.route("/connections")
    .get(authenticateToken, gatewayFunctions.getGateways)
    .post(
        authenticateToken,
        validateOptions<Option>([
            ["botId", "string", false],
            ["endpointURL", "string", false],
            ["ownerId", "string", false],
            ["token", "string", false],
        ]),
        gatewayFunctions.spawnGateway
    );
app.delete("/connections/:connectionId", authenticateToken, validateOptions<Option>([["botId", "string", false]]), gatewayFunctions.destroyGateway);

export default async () => {
    const connectionsToCreate = await prisma.bot.findMany({});
    console.log(`Found ${connectionsToCreate.length} connections to reconnect.`);
    for (const { token, endpointURL, botId, ownerId } of connectionsToCreate) {
        const { connectionId, options, worker } = gatewayFunctions.createConnection({ token, endpointURL, botId, ownerId });
        console.log(`Created connection ${connectionId} with botId of ${options.botId}`);
        connections.set(connectionId, { options, worker });
    }
    return app;
};
