import { EventDispatcher } from '../../../lib/common/core/EventDispatcher';

export class WSMessageHub extends EventDispatcher {
  sock: WebSocket;
  private queue: string[];

  constructor(url: string, protocols?: string | string[]) {
    super();

    this.sock = new WebSocket(url, protocols);

    this.sock.addEventListener('message', message => {
      const data = JSON.parse(message.data);
      if (data.event) {
        super.emit.apply(this, [data.event].concat(data.args || []));
      }
    });

    this.sock.onopen = () => {
      this.flush();
    };
  }

  private flush() {
    if (this.sock.readyState == this.sock.OPEN) {
      this.queue.forEach($ => this.sock.send($));
      this.queue.length = 0;
    }
  }

  emit(event: string, ...args: any[]) {
    this.send({ event, args });
    super.emit.apply(this, arguments);
  }

  protected send(obj) {
    this.queue.push(JSON.stringify(obj));
    this.flush();
  }
}



export function getWsMessageHub(room: string) {
  return new WSMessageHub(`ws://${location.host}/test/${room || ''}`);
}
