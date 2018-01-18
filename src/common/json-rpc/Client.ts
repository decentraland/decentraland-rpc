import { EventDispatcher } from "../core/EventDispatcher";
import * as JsonRpc2 from "./json-rpc";

export { JsonRpc2 };

export interface ClientOpts extends JsonRpc2.ILogOpts {

}

/**
 * Creates a RPC Client.
 * It is intentional that Client does not create a WebSocket object since we prefer composability
 */
export class Client extends EventDispatcher implements JsonRpc2.IClient {
  private _responsePromiseMap: Map<number, { resolve: Function, reject: Function }> = new Map();
  private _nextMessageId: number = 0;
  private _emitLog: boolean = false;
  private _consoleLog: boolean = false;
  private _requestQueue: string[] = [];
  private _connected = false;

  constructor(opts?: ClientOpts) {
    super();
    this.setLogging(opts);

    if (typeof onmessage == 'undefined') {
      throw new TypeError('onmessage cannot be undefined or null');
    }

    if (typeof postMessage == 'undefined') {
      throw new TypeError('postMessage cannot be undefined or null');
    }

    addEventListener('message',
      (message: MessageEvent) => this.processMessage(message.data)
    );

    addEventListener('message', () => {
      if (this._connected == false) {
        this._connected = true;
        this._sendQueuedRequests();
      }
    }, { once: true });

    addEventListener('error',
      (err: ErrorEvent) => this.emit('error', err.error)
    );
  }

  public processMessage(messageStr: string) {
    this._logMessage(messageStr, 'receive');
    let message: JsonRpc2.Response & JsonRpc2.Notification;

    // Ensure JSON is not malformed
    try {
      message = JSON.parse(messageStr);
    } catch (e) {
      return this.emit('error', e);
    }

    // Check that messages is well formed
    if (!message) {
      this.emit('error', new Error(`Message cannot be null, empty or undefined`));
    } else if (message.id) {
      if (this._responsePromiseMap.has(message.id)) {
        // Resolve promise from pending message
        const promise = this._responsePromiseMap.get(message.id);
        if (message.result) {
          promise.resolve(message.result);
        } else if (message.error) {
          const error = Object.assign(new Error('Remote error'), message.error);
          promise.reject(error);
        } else {
          this.emit('error', new Error(`Response must have result or error: ${messageStr}`));
        }
      } else {
        this.emit('error', new Error(`Response with id:${message.id} has no pending request`));
      }
    } else if (message.method) {
      // Server has sent a notification
      this.emit(message.method, message.params);
    } else {
      this.emit('error', new Error(`Invalid message: ${messageStr}`));
    }
  }

  /** Set logging for all received and sent messages */
  public setLogging({ logEmit, logConsole }: JsonRpc2.ILogOpts = {}) {
    this._emitLog = logEmit;
    this._consoleLog = logConsole;
  }

  private _send(message: JsonRpc2.Notification | JsonRpc2.Request) {
    this._requestQueue.push(JSON.stringify(message));
    this._sendQueuedRequests();
  }

  private _sendQueuedRequests() {
    if (this._connected) {
      const queue = this._requestQueue.splice(0, this._requestQueue.length);
      for (let messageStr of queue) {
        this._logMessage(messageStr, 'send');
        postMessage(messageStr);
      }
    }
  }

  private _logMessage(message: string, direction: 'send' | 'receive') {
    if (this._consoleLog) {
      console.log(`Client ${direction === 'send' ? '>' : '<'}`, message);
    }

    if (this._emitLog) {
      this.emit(direction, message);
    }
  }

  call(method: string, params?: any): Promise<any> {
    const id = ++this._nextMessageId;
    const message: JsonRpc2.Request = { id, method, params };

    return new Promise((resolve, reject) => {
      try {
        this._responsePromiseMap.set(id, { resolve, reject });
        this._send(message);
      } catch (error) {
        return reject(error);
      }
    });
  }

  notify(method: string, params?: any): void {
    this._send({ method, params });
  }

  /**
   * Builds an ES6 Proxy where api.domain.method(params) transates into client.send('{domain}.{method}', params) calls
   * api.domain.on{method} will add event handlers for {method} events
   * api.domain.emit{method} will send {method} notifications to the server
   * The api object leads itself to a very clean interface i.e `await api.Domain.func(params)` calls
   * This allows the consumer to abstract all the internal details of marshalling the message from function call to a string
   * Calling client.api('') will return an unprefixed client. e.g api.hello() is equivalient to client.send('hello')
   */
  api(prefix?: string): any {
    if (!Proxy) {
      throw new Error('api() requires ES6 Proxy. Please use an ES6 compatible engine');
    }

    return new Proxy({}, {
      get: (target: any, prop: string) => {
        if (target[prop]) {
          return target[prop];
        }
        // Special handling for prototype so console intellisense works on noice objects
        if (prop === '__proto__' || prop === 'prototype') {
          return Object.prototype;
        } else if (prefix === void 0) { // Prefix is undefined. Create domain prefix
          target[prop] = this.api(`${prop}.`);
        } else if (prop.substr(0, 2) === 'on' && prop.length > 3) {
          const method = prop[2].toLowerCase() + prop.substr(3);
          target[prop] = (handler: Function) => this.on(`${prefix}${method}`, handler);
        } else if (prop.substr(0, 4) === 'emit' && prop.length > 5) {
          const method = prop[4].toLowerCase() + prop.substr(5);
          target[prop] = (params: any) => this.notify(`${prefix}${method}`, params);
        } else {
          const method = prop;
          target[prop] = (params: any) => this.call(`${prefix}${method}`, params);
        }

        return target[prop];
      }
    });
  }
}
