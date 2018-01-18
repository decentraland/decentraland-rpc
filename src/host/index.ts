import { Server } from "../common/json-rpc/Server";
import { Dictionary } from "../common/core/EventDispatcher";

export * from "../common/core/EventDispatcher";
export * from "../common/core/MVCObject";

export interface ExposedAPI {
  [method: string]: (() => Promise<any>) | ((arg) => Promise<any>);
}

export interface ScriptingHostPlugin {
  getApi(): ExposedAPI;
  terminate(): void;
}

export interface ScriptingHostPluginConstructor<T> {
  new(api: any, permissons: any, metadata: any): T;
}

export interface ScriptingHostEvents {
  willTerminate: any;
  didTerminate: any;
  willEnable: any;
}

export const RegisteredAPIs: Dictionary<ScriptingHostPluginConstructor<ScriptingHostPlugin>> = {};

function registerPlugin(name: string, api: ScriptingHostPluginConstructor<ScriptingHostPlugin>) {
  if (name in RegisteredAPIs) {
    throw new Error(`The API ${name} is already registered`);
  }

  if (typeof api != 'function') {
    throw new Error(`The API ${name} is not a class, it is of type ${typeof api}`);
  }

  RegisteredAPIs[name] = api;
}

export class ScriptingHost extends Server<ScriptingHostEvents> {
  apiInstances: Dictionary<any> = {};

  constructor(worker: Worker) {
    super(worker);

    const plugins = Object.keys(RegisteredAPIs);

    if (plugins.length) {
      plugins.forEach(pluginName => {
        const api = this.api()[pluginName];

        const instance = new RegisteredAPIs[pluginName](api, null, null);

        this.apiInstances[pluginName] = instance;

        const exposedApi = instance.getApi();

        if (exposedApi && typeof exposedApi == 'object') {
          api.expose(exposedApi);
        }
      });
    }

    this.emit('willEnable');
    this.enable();
  }

  getPluginInstance<X>(plugin: { new(...args): X }): X | null;
  getPluginInstance(name: string): ScriptingHostPlugin | null;
  getPluginInstance(arg) {
    if (typeof arg == 'string') {
      return this.apiInstances[arg] || null;
    } else if (typeof arg == 'function') {
      return Object
        .keys(this.apiInstances)
        .map($ => this.apiInstances[$])
        .find($ => $ instanceof arg);
    }
    return null;
  }

  terminate() {
    this.emit('willTerminate');

    Object.keys(this.apiInstances).forEach($ => {
      if (this.apiInstances[$].terminate) {
        this.apiInstances[$].terminate();
      }
    });

    this.notify('SIGKILL');

    this._worker.terminate();

    this.emit('didTerminate');
  }


  static registerPlugin(name: string, api: ScriptingHostPluginConstructor<any>): void {
    registerPlugin(name, api);
  }

  static async fromURL(url: string) {
    const worker = new Worker(url);

    return new ScriptingHost(worker);
  }
}

export abstract class BasePlugin implements ScriptingHostPlugin {
  abstract getApi(): ExposedAPI;

  terminate(): void { /* noop */ }

  notify(method: string, params?: any) {
    if (typeof params == 'undefined') {
      this.api['emit' + method]();
    } else {
      this.api['emit' + method](params);
    }
  }

  constructor(protected api: any, protected permissons: any, protected metadata: any) {

  }
}
