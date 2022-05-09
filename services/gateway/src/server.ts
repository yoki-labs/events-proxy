import { PrismaClient } from "@prisma/client";
import express from "express";
import { destroyConnection } from "./controllers/connection";
import { build as buildGatewayFunctions } from "./controllers/gateway";
import type { Connection, Option } from "./typings";
import { authenticateToken, ResponseType, validateOptions } from "./util";

const app = express();
const prisma = new PrismaClient();
const connections = new Map<string, Connection>();
const gatewayFunctions = buildGatewayFunctions(connections, prisma);
const reconnectAttempts = new Map<string, number>();

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
        connections.set(connectionId, { connectionId, options, worker });
    }

    setInterval(async () => {
        // get all requests to currenct connections to see if they're still alive
        const requests = gatewayFunctions.runPonger();
        // resolve all the requests (usinng Promise.all is like resolving all the promises but concurrently)
        const resolvedRequests = await Promise.all(requests.map((x) => x[1]));
        // array holding all the verified dead connections
        const deadConnections: Connection[] = [];
        resolvedRequests.forEach(async (res, index) => {
            // if not even a connection (killed in between the time line 48 ran and now), skip
            const connection = connections.get(requests[index][0]);
            if (!connection) return;

            // if the response is not a proper 2xx, mark as dead
            if (!res || !res.ok) {
                deadConnections.push(connection);
            }

            // if the response is proper, parse the body
            const data = await res!.json().catch(() => ({}));

            // if the body is not a proper pong response, mark as dead
            if (data?.type !== ResponseType.PONG) return deadConnections.push(connection);
            reconnectAttempts.delete(connection.connectionId);
        });

        console.log(`Found ${deadConnections.length} dead connections with IDs ${deadConnections.map((x) => x.connectionId)}`);
        deadConnections.forEach(async (connection) => {
            // see if this connection is already counted as dead in the past
            const existingCounter = reconnectAttempts.get(connection.connectionId);

            // if no existing counter, set this as having failed once
            if (!existingCounter) return reconnectAttempts.set(connection.connectionId, 1);

            // if the amount of times this connection has failed to PONG properly exceeds 3, then kill
            if (existingCounter + 1 >= 3) {
                console.log(`Connection ${connection.connectionId} has exceeded dead threshold and will be killed.`);
                // kill connection
                await destroyConnection(connection);

                // remove from connections map
                connections.delete(connection.connectionId);

                // clear counter
                return reconnectAttempts.delete(connection.connectionId);
            }

            // increment counter
            reconnectAttempts.set(connection.connectionId, existingCounter ? existingCounter + 1 : 1);
        });
    }, 600_000);

    return app;
};
