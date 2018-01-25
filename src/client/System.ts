import { Client } from '../common/json-rpc/Client'
import { getApi } from '../common/json-rpc/API'
import { ILogOpts } from '../common/json-rpc/types'

/** this is defined in the constructor ComponentSystem() */
const loadComponentsNotificationName = 'LoadComponents'

const injectedComponentSymbol = Symbol('injectedComponent')

export interface System {
  systemDidEnable?(): Promise<void> | void
}

export type Component = any

export interface SystemTransport {
  /** sendMessage is used to send a string message thru the transport */
  sendMessage(message: string): void
  /** the onConnect callback is called when the transport gets connected */
  onConnect?(callback: () => void): void
  /** the onMessage callback is called when the transport receives a message */
  onMessage(callback: (message: string) => void): void
  /** the onError callback is called when the transport triggers an error */
  onError?(callback: (e: Error) => void): void
}

/**
 * This function decorates parameters to load components
 * @param componentName component name to load
 */
export function inject(componentName?: string) {
  if (componentName !== undefined && !componentName) {
    throw new TypeError('Component name cannot be null / empty')
  }
  return function<T extends System>(target: T, propertyKey: keyof T) {
    getInjectedComponents(target).set(propertyKey, componentName || propertyKey)
  }
}

export function getInjectedComponents<T extends System>(
  instance: T
): Map<keyof T, string> {
  const instanceAny: any = instance
  instanceAny[injectedComponentSymbol] =
    instanceAny[injectedComponentSymbol] || new Map()
  return instanceAny[injectedComponentSymbol]
}

async function _injectComponents(target: System) {
  const injectedMap = getInjectedComponents(target)

  if (injectedMap.size === 0) return

  await target.loadComponents(Array.from(injectedMap.values()))

  injectedMap.forEach((componentName: string, property) => {
    target[property] = target.loadedComponents[componentName]
    console.log(`Setting property ${property} with component ${componentName}`)
  })
}

export class System extends Client {
  static inject = inject

  loadedComponents: { [key: string]: Component } = {}

  constructor(private transport: SystemTransport, opt?: ILogOpts) {
    super(opt)

    if (transport.onError) {
      transport.onError(e => {
        this.emit('error', e)
      })
    }

    transport.onMessage(message => {
      this.processMessage(message)
    })

    if (transport.onConnect) {
      transport.onConnect(() => {
        this.didConnect()
      })
    } else {
      this.didConnect()
    }
  }

  sendMessage(message: string) {
    this.transport.sendMessage(message)
  }

  /**
   * Provide a global point of access to a service without
   * coupling users to the concrete class that implements it.
   *
   * @param componentName Name of the plugin we are trying to obtain
   * @returns {object} loadedComponents
   */
  async loadComponents(
    componentNames: string[]
  ): Promise<{ [key: string]: any }> {
    const loadedKeys = Object.keys(this.loadedComponents)
    const keysToRequest = componentNames.filter($ => !loadedKeys.includes($))

    if (keysToRequest.length) {
      await this.call(loadComponentsNotificationName, [keysToRequest])

      // Load / request the components
      keysToRequest.forEach(async componentName => {
        this.loadedComponents[componentName] = getApi(this, componentName)
      })
    }

    return this.loadedComponents
  }

  protected didConnect() {
    const injection = _injectComponents(this)

    super.didConnect()

    injection
      .then(() => {
        if (this.systemDidEnable) {
          try {
            const r = this.systemDidEnable()
            if (r && r instanceof Promise) {
              r.catch(e => this.emit('error', e))
            }
          } catch (e) {
            this.emit('error', e)
          }
        }
      })
      .catch(e => this.emit('error', e))
  }
}
