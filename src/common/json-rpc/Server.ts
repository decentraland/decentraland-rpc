import { EventDispatcher } from "../core/EventDispatcher";
import * as JsonRpc2 from "./json-rpc";

export interface ServerOpts extends JsonRpc2.LogOpts {
  exposedAPI?: any;
}

/**
 * Creates a RPC Server.
 * It is intentional that Server does not create a Worker object since we prefer composability
 */
export class Server extends EventDispatcher implements JsonRpc2.Server {
  private _worker: Worker;
  private _exposedMethodsMap: Map<string, (params: any) => JsonRpc2.PromiseOrNot<any>> = new Map();
  private _emitLog: boolean = false;
  private _consoleLog: boolean = false;
  private _isEnabled = false;

  get isEnabled(): boolean {
    return this._isEnabled;
  }

  constructor(worker: Worker, opts: ServerOpts = {}) {
    super();
    this.setLogging(opts);

    if (!worker) {
      throw new TypeError('worker cannot be undefined or null');
    }

    this._worker = worker;

    worker.addEventListener('message', (me: MessageEvent) => this.processMessage(me.data));
    worker.addEventListener('error', (me: ErrorEvent) => this.emit('error', me));
  }

  /**
   * Execute this method after configuring the RPC methods and listeners.
   * It will send an empty notification to the client, then it (the client) will send all the enqueued messages.
   */
  enable() {
    if (!this._isEnabled) {
      this._isEnabled = true;
      this.notify('RPC.Enabled');
    }
  }

  private processMessage(messageStr: string): void {
    this._logMessage(messageStr, 'receive');
    let request: JsonRpc2.Request;

    // Ensure JSON is not malformed
    try {
      request = JSON.parse(messageStr);
    } catch (e) {
      return this._sendError(request, JsonRpc2.ErrorCode.ParseError);
    }

    // Ensure method is atleast defined
    if (request && request.method && typeof request.method === 'string') {
      if (request.id && typeof request.id === 'number') {
        const handler = this._exposedMethodsMap.get(request.method);
        // Handler is defined so lets call it
        if (handler) {
          try {
            const result: JsonRpc2.PromiseOrNot<any> = handler.call(null, request.params);
            if (result instanceof Promise) {
              // Result is a promise, so lets wait for the result and handle accordingly
              result.then((actualResult: any) => {
                this._send({ id: request.id, result: actualResult || {} });
              }).catch((error: Error) => {
                this._sendError(request, JsonRpc2.ErrorCode.InternalError, error);
              });
            } else {
              // Result is not a promise so send immediately
              this._send({ id: request.id, result: result || {} });
            }
          } catch (error) {
            this._sendError(request, JsonRpc2.ErrorCode.InternalError, error);
          }
        } else {
          this._sendError(request, JsonRpc2.ErrorCode.MethodNotFound);
        }
      } else {
        // Message is a notification, so just emit
        this.emit(request.method, request.params);
      }
    } else {
      // No method property, send InvalidRequest error
      this._sendError(request, JsonRpc2.ErrorCode.InvalidRequest);
    }
  }

  /** Set logging for all received and sent messages */
  public setLogging({ logEmit, logConsole }: JsonRpc2.LogOpts = {}) {
    this._emitLog = logEmit;
    this._consoleLog = logConsole;
  }

  private _logMessage(messageStr: string, direction: 'send' | 'receive') {
    if (this._consoleLog) {
      console.log(`Server ${direction === 'send' ? '>' : '<'}`, messageStr);
    }

    if (this._emitLog) {
      this.emit(direction, messageStr);
    }
  }

  private _send(message: JsonRpc2.Response | JsonRpc2.Notification) {
    const messageStr = JSON.stringify(message);
    this._logMessage(messageStr, 'send');
    this._worker.postMessage(messageStr);
  }

  private _sendError(request: JsonRpc2.Request, errorCode: JsonRpc2.ErrorCode, error?: Error) {
    try {
      this._send({
        id: request && request.id || -1,
        error: this._errorFromCode(errorCode, error && error.message || error, request && request.method)
      });
    } catch (error) {
      // Since we can't even send errors, do nothing. The connection was probably closed.
    }
  }

  private _errorFromCode(code: JsonRpc2.ErrorCode, data?: any, method?: string): JsonRpc2.Error {
    let message = '';

    switch (code) {
      case JsonRpc2.ErrorCode.InternalError:
        message = `InternalError: Internal Error when calling '${method}'`;
        break;
      case JsonRpc2.ErrorCode.MethodNotFound:
        message = `MethodNotFound: '${method}' wasn't found`;
        break;
      case JsonRpc2.ErrorCode.InvalidRequest:
        message = 'InvalidRequest: JSON sent is not a valid request object';
        break;
      case JsonRpc2.ErrorCode.ParseError:
        message = 'ParseError: invalid JSON received';
        break;
    }

    return { code, message, data };
  }

  expose(method: string, handler: (params: any) => Promise<any>): void {
    this._exposedMethodsMap.set(method, handler);
  }

  notify(method: string, params?: any): void {
    this._send({ method, params });
  }

  /**
   * Builds an ES6 Proxy where api.domain.expose(module) exposes all the functions in the module over RPC
   * api.domain.emit{method} calls will send {method} notifications to the client
   * The api object leads itself to a very clean interface i.e `await api.Domain.func(params)` calls
   * This allows the consumer to abstract all the internal details of marshalling the message from function call to a string
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

        if (prop === '__proto__' || prop === 'prototype') {
          return Object.prototype;
        } else if (prefix === void 0) {
          target[prop] = this.api(`${prop}.`);
        } else if (prop.substr(0, 2) === 'on' && prop.length > 3) {
          const method = prop[2].toLowerCase() + prop.substr(3);
          target[prop] = (handler: Function) => this.on(`${prefix}${method}`, handler);
        } else if (prop.substr(0, 4) === 'emit' && prop.length > 5) {
          const method = prop[4].toLowerCase() + prop.substr(5);
          target[prop] = (params: any) => this.notify(`${prefix}${method}`, params);
        } else if (prop === 'expose') {
          target[prop] = (module: any) => {
            if (!module || typeof module !== 'object') {
              throw new Error('Expected an iterable object to expose functions');
            }

            for (let funcName in module) {
              if (typeof module[funcName] === 'function') {
                this.expose(`${prefix}${funcName}`, module[funcName].bind(module));
              }
            }
          };
        } else {
          return undefined;
        }

        return target[prop];
      }
    });
  }
}
