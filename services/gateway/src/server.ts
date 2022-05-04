import express from "express";
import { build as buildGatewayFunctions } from "./controllers/gateway";
import type { Connection } from "./typings";

const app = express();
const connections = new Map<string, Connection>();
const gatewayFunctions = buildGatewayFunctions(connections);

app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(express.json());

app.get("/", (req, res) => res.json({ success: true, data: { message: "Server is alive!" } }));
app.post("/connections", gatewayFunctions.spawnGateway);
app.delete("/connections/:connectionId", gatewayFunctions.destroyGateway);

export default app;
