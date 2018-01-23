
export interface ComponentOptions {
  componentName: string
  on(event: string, handler: Function): void
  notify(event: string, params?: any): void
  expose(method: string, handler: (params: any) => Promise<any>): void
}

export interface Component {
  terminate?(): void
}

export interface ComponentConstructor<T> {
  new(options: ComponentOptions): T
}

export interface ScriptingHostEvents {
  willTerminate: any
  didTerminate: any
  willEnable: any
}

export type ExposableMethod = (...args: any[]) => Promise<any>
