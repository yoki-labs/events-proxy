import { WebSocketManager } from "guilded.js";

export function spawnGateway(gatewayOptions: GatewayOptions) {
  // TODO: Spawn a gateway with the provided options
  const gateway = new WebSocketManager(gatewayOptions);

  gateway.socket.on("message", async (data) => {
    await fetch(gatewayOptions.userEndpointUrl, {
      body: JSON.stringify(data),
    }).catch(() => {
      // TODO: handle errors better in future but for now this will prevent errors from crashing the bot
      return null;
    });
  });

  return gateway;
}

export interface GatewayOptions extends WebSocketOptions {
  userEndpointUrl: string;
}
