import type { TtsProvider } from "./types.js";

export class TtsQueue {
  private chain: Promise<void> = Promise.resolve();

  constructor(private readonly provider: TtsProvider) {}

  enqueue(text: string): void {
    this.chain = this.chain.then(() => this.provider.speak(text));
  }
}
