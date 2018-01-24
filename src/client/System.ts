import { Client } from '../common/json-rpc/Client'
import { getApi } from '../common/json-rpc/API'
import { ILogOpts } from '../common/json-rpc/types'

/** this is defined in the constructor ComponentSystem() */
const loadComponentsNotificationName = 'LoadComponents'

const injectedComponentSymbol = Symbol('injectedComponent')

export interface System {
  systemDidEnable?(): Promise<void> | void
}

export interface Component {}

export interface SystemTransport {
  sendMessage(message: string): void
  onConnect?(callback: () => void): void
  onMessage(callback: (message: string) => void): void
  onError?(callback: (e: Error) => void): void
}

export function inject<T extends System>(target: T, propertyKey: keyof T) {
  getInjectedComponents(target).add(propertyKey)
}

export function getInjectedComponents<T extends System>(
  instance: T
): Set<keyof T> {
  const instanceAny: any = instance
  instanceAny[injectedComponentSymbol] =
    instanceAny[injectedComponentSymbol] || new Set()
  return instanceAny[injectedComponentSymbol]
}

async function _injectComponents(target: System) {
  const injectedSet = getInjectedComponents(target)

  if (injectedSet.size === 0) return

  await target.loadComponents(Array.from(injectedSet))

  injectedSet.forEach(
    componentName =>
      ((target as any)[componentName] = target.loadedComponents[componentName])
  )
}

export class System extends Client {
  static inject = inject

  loadedComponents: { [key: string]: Component } = {}

  constructor(private transport: SystemTransport, opt?: ILogOpts) {
    super(opt)

    if (transport.onConnect) {
      transport.onConnect(() => {
        this.didConnect()
      })
    } else {
      this.didConnect()
    }

    if (transport.onError) {
      transport.onError(e => {
        this.emit('error', e)
      })
    }

    transport.onMessage(message => {
      this.processMessage(message)
    })
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
