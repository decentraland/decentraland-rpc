import { Client } from '../common/json-rpc/Client'

export class WebWorkerClient extends Client {
  constructor() {
    super()

    if (typeof (onmessage as any) === 'undefined') {
      throw new TypeError('onmessage cannot be undefined or null')
    }

    if (typeof (postMessage as any) === 'undefined') {
      throw new TypeError('postMessage cannot be undefined or null')
    }

    addEventListener('message',
      (message: MessageEvent) => {
        try {
          this.processMessage(message.data)
        } catch (e) {
          this.emit('error', e)
        }
      }
    )

    addEventListener('message',
      () => this.didConnect(),
      { once: true }
    )

    addEventListener('error',
      (err: ErrorEvent) => this.emit('error', err.error)
    )
  }

  sendMessage(message: string) {
    postMessage(message)
  }
}
