import { Dictionary } from "../common/core/EventDispatcher";
import { WebWorkerServer } from "./WebWorkerServer";

export interface ExposedAPI {
  [method: string]: (() => Promise<any>) | ((arg) => Promise<any>);
}

export interface IPluginOptions {
  pluginName: string;
  on(event: string, handler: Function): void;
  notify(event: string, params?: any): void;
  expose(method: string, handler: <T>(params: any) => Promise<T>): void;
}


export interface ScriptingHostPlugin {
  terminate(): void;
}

export interface ScriptingHostPluginConstructor<T> {
  new(options: IPluginOptions): T;
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

export class ScriptingHost extends WebWorkerServer<ScriptingHostEvents> {
  apiInstances: Dictionary<any> = {};

  constructor(worker: Worker) {
    super(worker);

    const plugins = Object.keys(RegisteredAPIs);

    if (plugins.length) {
      plugins.forEach(pluginName => {
        const instance = new RegisteredAPIs[pluginName]({
          pluginName,
          on: (event: string, handler: (params) => void) => this.on(`${pluginName}.${event}`, handler),
          notify: (event: string, params?: any) => this.notify(`${pluginName}.${event}`, params),
          expose: (event: string, handler: <T>(params) => Promise<T>) => this.expose(`${pluginName}.${event}`, handler)
        });

        this.apiInstances[pluginName] = instance;
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

    this.worker.terminate();

    this.emit('didTerminate');
  }


  static registerPlugin(name: string): (klass: ScriptingHostPluginConstructor<ScriptingHostPlugin>) => void;
  static registerPlugin(name: string, api: ScriptingHostPluginConstructor<any>): void;
  static registerPlugin(name: string, api?: ScriptingHostPluginConstructor<any>) {
    if (!api) {
      return function (api: ScriptingHostPluginConstructor<ScriptingHostPlugin>) {
        registerPlugin(name, api);
      };
    }
    registerPlugin(name, api);
  }

  static async fromURL(url: string) {
    const worker = new Worker(url);

    return new ScriptingHost(worker);
  }
}

export type ExposableMethod = (...args) => Promise<any>;

export function exposeMethod(target: BasePlugin, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<ExposableMethod>) {
  target._exposedMethodsSet = target._exposedMethodsSet || new Set();
  target._exposedMethodsSet.add(propertyKey.toString());
}

export abstract class BasePlugin implements ScriptingHostPlugin {
  _exposedMethodsSet: Set<string>;

  terminate(): void { /* noop */ }

  constructor(protected options: IPluginOptions) {
    if (this._exposedMethodsSet) {
      this._exposedMethodsSet.forEach($ => {
        this.options.expose($, this[$].bind(this));
      });
    }
  }

  static expose = exposeMethod;
}
