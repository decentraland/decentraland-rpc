import { EventDispatcher } from '../../../lib/common/core/EventDispatcher';

export class WSMessageHub extends EventDispatcher {
  sock: WebSocket;
  private queue: string[] = [];
  private _isConnectedPromise: Promise<WSMessageHub> = null;

  waitForConnection() {
    if (this.sock.readyState == this.sock.OPEN) {
      return Promise.resolve(this);
    } else {
      return this._isConnectedPromise;
    }
  }

  constructor(url: string, protocols?: string | string[]) {
    super();

    let resolve = null;
    let reject = null;

    this._isConnectedPromise = new Promise((a, b) => {
      resolve = a;
      reject = b;
    });

    this.sock = new WebSocket(url, protocols);

    this.sock.addEventListener('message', message => {
      console.log('receive', message.data);
      const data = JSON.parse(message.data);
      if (data.event) {
        super.emit(data.event, ...(data.args || []));
      }
    });

    this.sock.addEventListener('open', () => {
      this.flush();
      resolve(this);
    });

    this.sock.addEventListener('error', (err) => {
      reject(err);
      this.emit('error', err);
    });
  }

  async flush() {
    if (this.queue.length == 0) return;

    let resolve = null;
    let reject = null;

    const x = new Promise((a, b) => {
      resolve = a;
      reject = b;
    });

    if (this.sock.readyState == this.sock.CONNECTING) {
      return this._isConnectedPromise;
    }

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
