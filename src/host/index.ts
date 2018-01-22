import { Dictionary } from "../common/core/EventDispatcher";
import { WebWorkerServer } from "./WebWorkerServer";
import { IPluginOptions, ScriptingHostPlugin, ScriptingHostPluginConstructor, ExposableMethod } from "./types";

const exposedMethodSymbol = Symbol('exposedMethod');

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

export class ScriptingHost extends WebWorkerServer {
  apiInstances: Dictionary<any> = {};

  constructor(worker: Worker) {
    super(worker);

    const plugins = Object.keys(RegisteredAPIs);

    if (plugins.length) {
      plugins.forEach(pluginName => {
        const instance = new RegisteredAPIs[pluginName]({
          pluginName,
          on: (event: string, handler: <A, O extends object>(params: Array<A> | O) => void) => this.on(`${pluginName}.${event}`, handler),
          notify: (event: string, params?: any) => this.notify(`${pluginName}.${event}`, params),
          expose: (event: string, handler: <A, O extends object, T>(params: Array<A> | O) => Promise<T>) => this.expose(`${pluginName}.${event}`, handler)
        });

        this.apiInstances[pluginName] = instance;
      });
    }

    this.emit('willEnable');
    this.enable();
  }

  getPluginInstance<X>(plugin: { new(options: IPluginOptions): X }): X | null;
  getPluginInstance(name: string): ScriptingHostPlugin | null;
  getPluginInstance(arg: any) {
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

export function exposeMethod(target: BasePlugin, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<ExposableMethod>) {
  getExposedMethods(target).add(propertyKey.toString());
}

export function getExposedMethods(instance: any): Set<string> {
  instance[exposedMethodSymbol] = instance[exposedMethodSymbol] || new Set();
  return instance[exposedMethodSymbol];
}

export abstract class BasePlugin implements ScriptingHostPlugin {
  terminate(): void { /* noop */ }

  constructor(protected options: IPluginOptions) {
    const that = this as any as { [key: string]: Function };
    getExposedMethods(this).forEach(($: any) => {
      this.options.expose($, that[$].bind(this));
    });
  }

  static expose = exposeMethod;
}
