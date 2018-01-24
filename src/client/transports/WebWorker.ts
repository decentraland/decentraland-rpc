import { SystemTransport } from '../index'

export function WebWorkerTransport(): SystemTransport {
  if (typeof (onmessage as any) === 'undefined') {
    throw new TypeError('onmessage cannot be undefined or null')
  }

  if (typeof (postMessage as any) === 'undefined') {
    throw new TypeError('postMessage cannot be undefined or null')
  }

  const api: SystemTransport = {
    onConnect(handler) {
      addEventListener('message', () => handler(), { once: true })
    },
    onError(handler) {
      addEventListener('error', (err: ErrorEvent) => handler(err.error))
    },
    onMessage(handler) {
      addEventListener('message', (message: MessageEvent) => {
        handler(message.data)
      })
    },
    sendMessage(message) {
      postMessage(message)
    }
  }

  return api
}
