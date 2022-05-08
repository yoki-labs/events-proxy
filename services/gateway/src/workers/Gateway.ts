import { WebSocketManager } from "@guildedjs/ws";
import { parentPort, workerData } from "worker_threads";
import { WorkerMessage } from "../typings";

// events for this worker
// 0, event received
// 1, kill gateway
// 2, gateway successfully killed
const { token } = workerData;
if (!token) throw new Error("missing token");
const gateway = new WebSocketManager({ token });
gateway.connect();
gateway.emitter.on("gatewayEvent", (event, data) => {
    parentPort!.postMessage({ type: WorkerMessage.PostData, event, data });
});

parentPort!.on("message", ({ type }) => {
    if (type === WorkerMessage.DeleteGateway) {
        gateway.destroy();
    }
});
