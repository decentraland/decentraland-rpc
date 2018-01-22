import { WebWorkerClient } from './WebWorkerClient'
import { getApi } from '../common/json-rpc/API'

if (typeof (onmessage as any) === 'undefined' || typeof (postMessage as any) === 'undefined') {
  throw new Error('Error: Running scripting client outside WebWorker')
}

new Function(`XMLHttpRequest = function () { throw new Error('XMLHttpRequest is disabled. Please use fetch'); };`)()

export const ScriptingClient = new WebWorkerClient()

export function getPlugin<T extends {} = any>(pluginName: string): T {
  return getApi(ScriptingClient, pluginName)
}
