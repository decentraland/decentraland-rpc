import { EventDispatcher } from "../core/EventDispatcher";
import * as JsonRpc2 from "./json-rpc";
import { EventDispatcherBinding } from "../../host/index";

export interface ServerOpts extends JsonRpc2.ILogOpts {

}

/**
 * Creates a RPC Server.
 * It is intentional that Server does not create a Worker object since we prefer composability
 */
export abstract class Server<ClientType = any> extends EventDispatcher implements JsonRpc2.IServer {
  private _exposedMethodsMap: Map<string, (params: any) => JsonRpc2.PromiseOrNot<any>> = new Map();
  private _consoleLog: boolean = false;
  private _isEnabled = false;

  get isEnabled(): boolean {
    return this._isEnabled;
  }

  constructor(opts: ServerOpts = {}) {
    super();
    this.setLogging(opts);
  }

  abstract sendMessage(to: ClientType, message: string);
  abstract getAllClients(): Iterable<ClientType>;

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

  protected processMessage(from: ClientType, messageStr: string): void {
    this._logMessage(messageStr, 'receive');
    let request: JsonRpc2.Request;

    // Ensure JSON is not malformed
    try {
      request = JSON.parse(messageStr);
    } catch (e) {
      return this._sendError(from, request, JsonRpc2.ErrorCode.ParseError);
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
                this._send(from, { id: request.id, result: actualResult || {} });
              }).catch((error: Error) => {
                this._sendError(from, request, JsonRpc2.ErrorCode.InternalError, error);
              });
            } else {
              // Result is not a promise so send immediately
              this._send(from, { id: request.id, result: result || {} });
            }
          } catch (error) {
            this._sendError(from, request, JsonRpc2.ErrorCode.InternalError, error);
          }
        } else {
          this._sendError(from, request, JsonRpc2.ErrorCode.MethodNotFound);
        }
      } else {
        // Message is a notification, so just emit
        this.emit(request.method, request.params, from);
      }
    } else {
      // No method property, send InvalidRequest error
      this._sendError(from, request, JsonRpc2.ErrorCode.InvalidRequest);
    }
  }

  on(method: 'error', callback: (error) => void, once?: boolean): EventDispatcherBinding;
  on(method: string, callback: (params: any, sender: ClientType) => void, once?: boolean): EventDispatcherBinding;
  on(method: string, callback: (params: any, sender: ClientType) => void, once?: boolean): EventDispatcherBinding {
    return super.on(method, callback, once);
  }

  once(method: 'error', callback: (error) => void): EventDispatcherBinding;
  once(method: string, callback: (params: any, sender: ClientType) => void): EventDispatcherBinding;
  once(method: string, callback: (params: any, sender: ClientType) => void): EventDispatcherBinding {
    return super.once(method, callback);
  }

  emit(event: 'error', error: any);
  emit(method: string, params: any, sender?: ClientType): void;
  emit(method: string, params: any, sender?: ClientType): void {
    return super.emit(method, params, sender);
  }


  /** Set logging for all received and sent messages */
  public setLogging({ logConsole }: JsonRpc2.ILogOpts = {}) {
    this._consoleLog = logConsole;
  }

  private _logMessage(messageStr: string, direction: 'send' | 'receive') {
    if (this._consoleLog) {
      console.log(`${direction === 'send' ? 'Server > Client' : 'Server < Client'}`, messageStr);
    }
  }

  private _send(receiver: ClientType, message: JsonRpc2.Response | JsonRpc2.Notification) {
    const messageStr = JSON.stringify(message);
    this._logMessage(messageStr, 'send');
    this.sendMessage(receiver, messageStr);
  }

  private _sendError(receiver: ClientType, request: JsonRpc2.Request, errorCode: JsonRpc2.ErrorCode, error?: Error) {
    try {
      this._send(receiver, {
        id: request && request.id || -1,
        error: this._errorFromCode(errorCode, error && error.message || error, request && request.method)
      });
    } catch (error) {
      // Since we can't even send errors, do nothing. The connection was probably closed.
    }
  }

  private _errorFromCode(code: JsonRpc2.ErrorCode, data?: any, method?: string): JsonRpc2.IError {
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
    // Broadcast message to all clients
    const clients = this.getAllClients();

    if (clients) {
      for (let client of clients) {
        this._send(client, { method, params });
      }
    } else {
      throw new Error('Server does not support broadcasting. No "getAllClients: ClientType" returned null');
    }
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
          target[prop] = (handler: any) => this.on(`${prefix}${method}`, handler);
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
