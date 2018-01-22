import { Server } from "../common/json-rpc/Server";
import { IServerOpts } from "../common/json-rpc/types";

export class WebWorkerServer extends Server<Worker> {
  constructor(public worker: Worker, opt: IServerOpts = {}) {
    super(opt);

    if (!this.worker) {
      throw new TypeError('worker cannot be undefined or null');
    }

    this.worker.addEventListener('message', (me: MessageEvent) => this.processMessage(this.worker, me.data));
    this.worker.addEventListener('error', (me: ErrorEvent) => this.emit('error', me));
  }

  sendMessage(receiver: Worker, message: string) {
    receiver.postMessage(message);
  }

  getAllClients() {
    return [this.worker];
  }
}
