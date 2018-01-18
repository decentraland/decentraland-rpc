import { Server, ServerOpts } from "../common/json-rpc/Server";

export class WebWorkerServer<T = any> extends Server<Worker> {
  constructor(public worker: Worker, opt: ServerOpts = {}) {
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
