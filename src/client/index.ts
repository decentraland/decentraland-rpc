import { WebWorkerClient } from './WebWorkerClient'
import { getApi } from '../common/json-rpc/API'

// SANITY CHECKS

if (typeof (onmessage as any) === 'undefined' || typeof (postMessage as any) === 'undefined') {
  throw new Error('Error: Running scripting client outside WebWorker')
}

new Function(`XMLHttpRequest = function () { throw new Error('XMLHttpRequest is disabled. Please use fetch'); };`)()

/** this is defined in the constructor ComponentSystem() */
const loadComponentsNotificationName = 'LoadComponents'

const loadedComponents: { [key: string]: any } = {}

export const ScriptingClient = new WebWorkerClient()

/**
 * Provide a global point of access to a service without
 * coupling users to the concrete class that implements it.
 *
 * @param componentName Name of the plugin we are trying to obtain
 */
export async function getComponent<T extends {} = any>(componentName: string): Promise<T> {
  if (componentName in loadedComponents) {
    return Promise.resolve(loadedComponents[componentName] as T)
  }

  await ScriptingClient.call(loadComponentsNotificationName, [[componentName]])

  const plugin = loadedComponents[componentName] = getApi(ScriptingClient, componentName)

  return Promise.resolve(plugin)
}
