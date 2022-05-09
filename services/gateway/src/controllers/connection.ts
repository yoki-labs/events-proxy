import { join } from "node:path";
import { Worker } from "worker_threads";
import { nanoid } from "nanoid";
import fetch from "node-fetch";
import { type Option, WorkerMessage, Connection } from "../typings";
import { RequestType } from "../util";

export const createConnection = ({ botId, endpointURL, ownerId, token }: Option) => {
    const connectionId = nanoid(21);
    const worker = new Worker(join(__dirname, "..", "workers", "Gateway.js"), { workerData: { token } });
    worker.on("message", ({ type, event, data }) => {
        if (type === WorkerMessage.PostData) {
            fetch(endpointURL, {
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                body: JSON.stringify({ type: RequestType.EVENT, event, data: data.d }),
                method: "POST",
            })
                .then(() => console.log(`Successfully sent event ${event} to ${endpointURL} (${botId})`))
                .catch(console.error);
        }
    });
    worker.on("error", console.log);
    return { connectionId, worker, options: { botId, endpointURL, ownerId, token } };
};

export const destroyConnection = async (connection: Connection) => {
    connection.worker.postMessage({ type: 1 });
    connection.worker.removeAllListeners();
    await connection.worker.terminate();
};
