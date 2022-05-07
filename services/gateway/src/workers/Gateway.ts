import { WebSocketManager } from "@guildedjs/ws";
import { parentPort, workerData } from "worker_threads";

// events for this worker
// 0, event received
// 1, kill gateway
// 2, gateway successfully killed
const { token } = workerData;
if (!token) throw new Error("missing token");
const gateway = new WebSocketManager({ token });
gateway.connect();
gateway.emitter.on("gatewayEvent", (event, data) => {
    parentPort!.postMessage({ type: 0, event, data });
});

parentPort!.on("message", ({ type }) => {
    if (type === 1) {
        gateway.destroy();
        parentPort!.postMessage({ type: 2 });
    }
});
