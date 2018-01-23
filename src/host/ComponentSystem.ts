import { Dictionary } from '../common/core/EventDispatcher'
import { WebWorkerServer } from './WebWorkerServer'
import { ComponentClass, Component, ComponentOptions } from './Component'

const componentNameSymbol = Symbol('pluginName')
const registeredComponents: Dictionary<ComponentClass<Component>> = {}

namespace PrivateHelpers {
  export function _registerComponent(componentName: string, api: ComponentClass<Component>) {
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

  export function unmountComponent(component: Component) {
    if (component.componentWillUnmount) {
      const promise = component.componentWillUnmount()
      if (promise && 'catch' in promise) {
        promise.catch(error => console.error('Error unmounting component', { component, error }))
      }
    }
  }

  export function mountComponent(component: Component) {
    if (component.componentDidMount) {
      const promise = component.componentDidMount()
      if (promise && 'catch' in promise) {
        promise.catch(error => console.error('Error mounting component', { component, error }))
      }
    }
  }
}

// HERE WE START THE EXPORTS

export enum ComponentSystemEvents {
  systemWillUnmount = 'systemWillUnmount',
  systemWillEnable = 'systemWillEnable',
  systemDidUnmount = 'systemDidUnmount'
}

export function getComponentName(klass: ComponentClass<Component>): string | null {
  return (klass as any)[componentNameSymbol] || null
}

export function registerComponent(componentName: string): (klass: ComponentClass<Component>) => void {
  return function (api: ComponentClass<Component>) {
    PrivateHelpers._registerComponent(componentName, api)
  }
}

export class ComponentSystem extends WebWorkerServer {
  componentInstances: Map<string, Component> = new Map()

  constructor(worker: Worker) {
    super(worker)

    this.expose('LoadComponents', this.RPCLoadComponents.bind(this))
  }

  static async fromURL(url: string) {
    const worker = new Worker(url)

    return new ComponentSystem(worker)
  }

  static async fromBlob(blob: Blob) {
    const worker = new Worker(window.URL.createObjectURL(blob))

    return new ComponentSystem(worker)
  }

  enable() {
    this.emit(ComponentSystemEvents.systemWillEnable)
    this.componentInstances.forEach(PrivateHelpers.mountComponent)
    super.enable()
  }

  getComponentInstance<X>(component: { new(options: ComponentOptions): X }): X
  getComponentInstance(name: string): Component | null
  getComponentInstance(component: any) {
    if (typeof component === 'string') {
      if (this.componentInstances.has(component)) {
        return this.componentInstances.get(component)
      }
      if (component in registeredComponents) {
        return this.initializeComponent(registeredComponents[component])
      }
      return null
    } else if (typeof component === 'function') {
      const componentName = getComponentName(component)

      // if it has a name, use that indirection to find in the instance's map
      if (componentName != null) {
        if (this.componentInstances.has(componentName)) {
          return this.componentInstances.get(componentName)
        }

        // If we don't have a local instance, create the instance of the component
        return this.initializeComponent(component)
      }
    }

    throw Object.assign(new Error('Cannot get instance of the specified component'), { component })
  }

  unmount() {
    this.emit(ComponentSystemEvents.systemWillUnmount)

    this.componentInstances.forEach(PrivateHelpers.unmountComponent)
    this.componentInstances.clear()

    this.notify('SIGKILL')

    this.worker.terminate()

    this.emit(ComponentSystemEvents.systemDidUnmount)
  }

  protected initializeComponent<X extends Component>(ctor: { new(options: ComponentOptions): X, factory?(ctor: { new(options: ComponentOptions): X }, options: ComponentOptions): X }): X {
    const componentName = getComponentName(ctor)

    if (componentName === null) {
      throw new Error('The plugin is not registered')
    }

    if (this.componentInstances.has(componentName)) {
      return this.componentInstances.get(componentName) as X
    }

    const componentOptions: ComponentOptions = {
      componentName,
      on: (event, handler) => this.on(`${componentName}.${event}`, handler),
      notify: (event, params) => this.notify(`${componentName}.${event}`, params),
      expose: (event, handler) => this.expose(`${componentName}.${event}`, handler)
    }

    const instance = ctor.factory
      ? ctor.factory(ctor, componentOptions)
      : new ctor(componentOptions)

    this.componentInstances.set(componentName, instance)

    return instance
  }

  /**
   * Preloads a list of components
   */
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
