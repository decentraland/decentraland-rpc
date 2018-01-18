import { MVCObject } from '../../../dist/host';

export class SimpleSharedStateWS extends MVCObject {
  sock: WebSocket;

  constructor(url: string, protocols?: string | string[]) {
    super();

    this.sock = new WebSocket(url, protocols);

    this.sock.addEventListener('message', message => {
      const data = JSON.parse(message.data);
      if (data.event) {

      }
    });
  }
}
