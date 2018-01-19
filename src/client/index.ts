import { WebWorkerClient } from './WebWorkerClient';
import { getApi } from '../common/json-rpc/API';

if (typeof onmessage == 'undefined' || typeof postMessage == 'undefined') {
  throw new Error('Error: Running scripting client outside WebWorker');
}

new Function(`XMLHttpRequest = function () { throw new Error('XMLHttpRequest is disabled. Please use fetch'); };`)();

export const ScriptingClient = new WebWorkerClient();

export function getPlugin<T = any>(pluginName: string): T {
  return getApi(ScriptingClient, pluginName);
}
