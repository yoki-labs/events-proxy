import { join } from "node:path";
import { Worker } from "worker_threads";
import { nanoid } from "nanoid";
import fetch, { Response } from "node-fetch";
import { type Option, WorkerMessage, Connection } from "../typings";
import { RequestType, ResponseType } from "../util";

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
                .then(async (res) => {
                    console.log(`Sent event ${event} to ${endpointURL} (${botId})`);
                    const data = await res.json().catch(() => ({}));
                    if (data?.type !== ResponseType.RESPOND) console.log(`Didn't receive proper response from ${endpointURL} (${botId}) on event ${event}`);
                })
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
