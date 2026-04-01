import type {
  ParrotOverlayPayload,
  ParrotSpeakMessage,
} from "@captain-squawks/shared";
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

  /** @deprecated Prefer PARROT_SPEAK */
  broadcastParrotUpdate(payload: ParrotOverlayPayload): void {
    const msg = JSON.stringify({
      type: "parrot_update",
      payload,
    });
    this.sendRaw(msg);
  }

  broadcastParrotSpeak(message: ParrotSpeakMessage): void {
    const msg = JSON.stringify(message);
    this.sendRaw(msg);
  }

  broadcastJson(obj: unknown): void {
    const msg = JSON.stringify(obj);
    this.sendRaw(msg);
  }

  private sendRaw(msg: string): void {
    for (const s of this.sockets) {
      if (s.readyState === 1) {
        s.send(msg);
      }
    }
  }
}
