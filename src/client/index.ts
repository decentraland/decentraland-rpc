import { Client } from "../common/json-rpc/Client";

if (typeof onmessage == 'undefined' || typeof postMessage == 'undefined') {
  throw new Error('Error: Running scripting client outside WebWorker');
}

new Function(`XMLHttpRequest = function () { throw new Error('XMLHttpRequest is disabled. Please use fetch'); };`)();

export const ScriptingClient = new Client();
export const API = ScriptingClient.api('DCL');
