import type { ParrotOverlayPayload } from "@captain-squawks/shared";
import type { WebSocket } from "ws";

/**
 * Tracks Fastify websocket clients. Use `connection.socket` from the route handler.
 */
export class WsHub {
  private readonly sockets = new Set<WebSocket>();

  add(socket: WebSocket): void {
    this.sockets.add(socket);
    socket.on("close", () => {
      this.sockets.delete(socket);
    });
  }

  broadcastParrotUpdate(payload: ParrotOverlayPayload): void {
    const msg = JSON.stringify({
      type: "parrot_update",
      payload,
    });
    for (const s of this.sockets) {
      if (s.readyState === 1) {
        s.send(msg);
      }
    }
  }

  broadcastJson(obj: unknown): void {
    const msg = JSON.stringify(obj);
    for (const s of this.sockets) {
      if (s.readyState === 1) {
        s.send(msg);
      }
    }
  }
}
