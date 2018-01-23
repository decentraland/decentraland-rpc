import { WebWorkerClient } from './WebWorkerClient'
import { getApi } from '../common/json-rpc/API'

if (typeof (onmessage as any) === 'undefined' || typeof (postMessage as any) === 'undefined') {
  throw new Error('Error: Running scripting client outside WebWorker')
}

new Function(`XMLHttpRequest = function () { throw new Error('XMLHttpRequest is disabled. Please use fetch'); };`)()

const loadedPlugins: { [key: string]: any } = {}

export const ScriptingClient = new WebWorkerClient()

export async function getPlugin<T extends {} = any>(pluginName: string): Promise<T> {
  if (pluginName in loadedPlugins) {
    return Promise.resolve(loadedPlugins[pluginName] as T)
  }

  await ScriptingClient.call('LoadPlugin', [pluginName])

  const plugin = loadedPlugins[pluginName] = getApi(ScriptingClient, pluginName)

  return Promise.resolve(plugin)
}
