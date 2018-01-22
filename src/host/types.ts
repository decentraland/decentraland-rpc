
export interface IPluginOptions {
  pluginName: string;
  on(event: string, handler: Function): void;
  notify(event: string, params?: any): void;
  expose(method: string, handler: (params: any) => Promise<any>): void;
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

export type ExposableMethod = (...args: any[]) => Promise<any>;
