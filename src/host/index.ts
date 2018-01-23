import { Dictionary } from '../common/core/EventDispatcher'
import { WebWorkerServer } from './WebWorkerServer'
import { IPluginOptions, ScriptingHostPlugin, ScriptingHostPluginConstructor, ExposableMethod } from './types'

const exposedMethodSymbol = Symbol('exposedMethod')
const pluginNameSymbol = Symbol('pluginName')

const RegisteredAPIs: Dictionary<ScriptingHostPluginConstructor<ScriptingHostPlugin>> = {}

function _registerPlugin(pluginName: string, api: ScriptingHostPluginConstructor<ScriptingHostPlugin>) {
  if (pluginNameSymbol in api) {
    throw new Error(`The API you are trying to register is already registered`)
  }

  if (pluginName in RegisteredAPIs) {
    throw new Error(`The API ${pluginName} is already registered`)
  }

  if (typeof (api as any) !== 'function') {
    throw new Error(`The API ${pluginName} is not a class, it is of type ${typeof api}`)
  }

  // save the registered name
  (api as any)[pluginNameSymbol] = pluginName

  RegisteredAPIs[pluginName] = api
}

export function getPluginName(klass: ScriptingHostPluginConstructor<ScriptingHostPlugin>): string | null {
  return (klass as any)[pluginNameSymbol] || null
}

export function registerPlugin(pluginName: string): (klass: ScriptingHostPluginConstructor<ScriptingHostPlugin>) => void {
  return function (api: ScriptingHostPluginConstructor<ScriptingHostPlugin>) {
    _registerPlugin(pluginName, api)
  }
}

export class ScriptingHost extends WebWorkerServer {
  apiInstances: Map<string, ScriptingHostPlugin> = new Map()

  constructor(worker: Worker) {
    super(worker)

    this.expose('LoadPlugin', this.RPCLoadPlugin.bind(this))
    this.expose('LoadPlugins', this.RPCLoadPlugins.bind(this))
  }

  static async fromURL(url: string) {
    const worker = new Worker(url)

    return new ScriptingHost(worker)
  }

  static async fromBlob(blob: Blob) {
    const worker = new Worker(window.URL.createObjectURL(blob))

    return new ScriptingHost(worker)
  }

  enable() {
    this.emit('willEnable')
    super.enable()
  }

  getPluginInstance<X>(plugin: { new(options: IPluginOptions): X }): X
  getPluginInstance(name: string): ScriptingHostPlugin | null
  getPluginInstance(plugin: any) {
    if (typeof plugin === 'string') {
      if (this.apiInstances.has(plugin)) {
        return this.apiInstances.get(plugin)
      }
      if (plugin in RegisteredAPIs) {
        return this.instantiatePlugin(RegisteredAPIs[plugin])
      }
      return null
    } else if (typeof plugin === 'function') {
      // if it has a name, use that indirection to find in the instance's map
      if ('pluginName' in plugin && this.apiInstances.has(plugin.pluginName)) {
        return this.apiInstances.get(plugin.pluginName)
      }

      // If we don't have a local instance, create the instance of the plugin
      return this.instantiatePlugin(plugin)
    }

    throw Object.assign(new Error('Cannot get instance of the specified plugin'), { plugin })
  }

  terminate() {
    this.emit('willTerminate')

    Object.keys(this.apiInstances).forEach($ => {
      this.apiInstances.forEach((value, key) => {
        value.terminate()
      })
    })

    this.apiInstances.clear()

    this.notify('SIGKILL')

    this.worker.terminate()

    this.emit('didTerminate')
  }

  protected instantiatePlugin<X extends ScriptingHostPlugin>(ctor: { new(options: IPluginOptions): X }): X {
    const pluginName = getPluginName(ctor)

    if (pluginName === null) {
      throw new Error('The plugin is not registered')
    }

    if (this.apiInstances.has(pluginName)) {
      return this.apiInstances.get(pluginName) as X
    }

    const instance = new ctor({
      pluginName,
      on: (event: string, handler: <A, O extends object>(params: Array<A> | O) => void) => this.on(`${pluginName}.${event}`, handler),
      notify: (event: string, params?: any) => this.notify(`${pluginName}.${event}`, params),
      expose: (event: string, handler: <A, O extends object, T>(params: Array<A> | O) => Promise<T>) => this.expose(`${pluginName}.${event}`, handler)
    })

    this.apiInstances.set(pluginName, instance)

    return instance
  }

  // Preloads a plugin
  private async RPCLoadPlugin(pluginName: string) {
    if (typeof pluginName !== 'string') {
      throw new TypeError('LoadPlugin(name) name must be a string')
    }

    const plugin = this.getPluginInstance(pluginName)

    if (!plugin) {
      throw new TypeError(`Plugin not found ${pluginName}`)
    }
  }

  /// Preloads a list of plugins
  private async RPCLoadPlugins(pluginNames: string[]) {
    if (typeof pluginNames !== 'object' || !(pluginNames instanceof Array)) {
      throw new TypeError('LoadPlugin(name) name must be a string')
    }

    const notFound =
      pluginNames
        .map(name => ({ plugin: this.getPluginInstance(name), name }))
        .filter($ => $.plugin == null)
        .map($ => $.name)

    if (notFound.length) {
      throw new TypeError(`Plugins not found ${notFound.join(',')}`)
    }
  }
}

export function exposeMethod(target: BasePlugin, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<ExposableMethod>) {
  getExposedMethods(target).add(propertyKey.toString())
}

export function getExposedMethods(instance: any): Set<string> {
  instance[exposedMethodSymbol] = instance[exposedMethodSymbol] || new Set()
  return instance[exposedMethodSymbol]
}

export abstract class BasePlugin implements ScriptingHostPlugin {
  static expose = exposeMethod

  constructor(protected options: IPluginOptions) {
    const that = this as any as { [key: string]: Function }
    getExposedMethods(this).forEach(($: any) => {
      this.options.expose($, that[$].bind(this))
    })
  }

  terminate(): void { /* noop */ }
}
