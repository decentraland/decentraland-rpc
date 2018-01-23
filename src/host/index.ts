import { Dictionary } from '../common/core/EventDispatcher'
import { WebWorkerServer } from './WebWorkerServer'
import { ComponentOptions, Component, ComponentConstructor } from './types'

export * from './Component'

const componentNameSymbol = Symbol('pluginName')

const registeredComponents: Dictionary<ComponentConstructor<Component>> = {}

function _registerComponent(componentName: string, api: ComponentConstructor<Component>) {
  if (componentNameSymbol in api) {
    throw new Error(`The API you are trying to register is already registered`)
  }

  if (componentName in registeredComponents) {
    throw new Error(`The API ${componentName} is already registered`)
  }

  if (typeof (api as any) !== 'function') {
    throw new Error(`The API ${componentName} is not a class, it is of type ${typeof api}`)
  }

  // save the registered name
  (api as any)[componentNameSymbol] = componentName

  registeredComponents[componentName] = api
}

export function getComponentName(klass: ComponentConstructor<Component>): string | null {
  return (klass as any)[componentNameSymbol] || null
}

export function registerComponent(componentName: string): (klass: ComponentConstructor<Component>) => void {
  return function (api: ComponentConstructor<Component>) {
    _registerComponent(componentName, api)
  }
}

export class ScriptingHost extends WebWorkerServer {
  apiInstances: Map<string, Component> = new Map()

  constructor(worker: Worker) {
    super(worker)

    this.expose('LoadComponent', this.RPCLoadComponent.bind(this))
    this.expose('LoadComponents', this.RPCLoadComponents.bind(this))
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

  getComponentInstance<X>(component: { new(options: ComponentOptions): X }): X
  getComponentInstance(name: string): Component | null
  getComponentInstance(component: any) {
    if (typeof component === 'string') {
      if (this.apiInstances.has(component)) {
        return this.apiInstances.get(component)
      }
      if (component in registeredComponents) {
        return this.initializeComponent(registeredComponents[component])
      }
      return null
    } else if (typeof component === 'function') {
      const componentName = getComponentName(component)

      // if it has a name, use that indirection to find in the instance's map
      if (componentName != null) {
        if (this.apiInstances.has(componentName)) {
          return this.apiInstances.get(componentName)
        }

        // If we don't have a local instance, create the instance of the component
        return this.initializeComponent(component)
      }
    }

    throw Object.assign(new Error('Cannot get instance of the specified component'), { component })
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

  protected initializeComponent<X extends Component>(ctor: { new(options: ComponentOptions): X }): X {
    const componentName = getComponentName(ctor)

    if (componentName === null) {
      throw new Error('The plugin is not registered')
    }

    if (this.apiInstances.has(componentName)) {
      return this.apiInstances.get(componentName) as X
    }

    const instance = new ctor({
      componentName,
      on: (event: string, handler: <A, O extends object>(params: Array<A> | O) => void) => this.on(`${componentName}.${event}`, handler),
      notify: (event: string, params?: any) => this.notify(`${componentName}.${event}`, params),
      expose: (event: string, handler: <A, O extends object, T>(params: Array<A> | O) => Promise<T>) => this.expose(`${componentName}.${event}`, handler)
    })

    this.apiInstances.set(componentName, instance)

    return instance
  }

  // Preloads a plugin
  private async RPCLoadComponent(componentName: string) {
    if (typeof componentName !== 'string') {
      throw new TypeError('RPCLoadComponent(name) name must be a string')
    }

    const plugin = this.getComponentInstance(componentName)

    if (!plugin) {
      throw new TypeError(`Plugin not found ${componentName}`)
    }
  }

  /// Preloads a list of components
  private async RPCLoadComponents(componentNames: string[]) {
    if (typeof componentNames !== 'object' || !(componentNames instanceof Array)) {
      throw new TypeError('RPCLoadComponents(names) name must be an array of strings')
    }

    const notFound =
      componentNames
        .map(name => ({ component: this.getComponentInstance(name), name }))
        .filter($ => $.component == null)
        .map($ => $.name)

    if (notFound.length) {
      throw new TypeError(`Components not found ${notFound.join(',')}`)
    }
  }
}
