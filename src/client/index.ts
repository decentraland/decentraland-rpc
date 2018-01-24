// SANITY CHECKS

if (typeof (onmessage as any) === 'undefined' || typeof (postMessage as any) === 'undefined') {
  throw new Error('Error: Running scripting client outside WebWorker')
}

new Function(`XMLHttpRequest = function () { throw new Error('XMLHttpRequest is disabled. Please use fetch'); };`)()

// Exports

export * from './System'

import * as Transports from './transports'

export { Transports }
