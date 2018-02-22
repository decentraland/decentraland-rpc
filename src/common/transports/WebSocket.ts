import { ScriptingTransport } from '../json-rpc/types'

export interface IWebSocketEventMap {
  close: any
  error: any
  message: { data: any }
  open: any
}

/**
 * This interface should be compatible with the Browsers interface
 * and npm ws package for servers
 */
export interface IWebSocket {
  CONNECTING: number
  OPEN: number
  CLOSING: number
  CLOSED: number

  readyState: number

  onopen: (event: any) => void
  onerror: (event: any) => void
  onclose: (event: any) => void
  onmessage: (event: any) => void

  close(code?: number, data?: string): void

  send(data: any, cb?: (err: Error) => void): void
  send(data: any, options: any, cb?: (err: Error) => void): void

  terminate?(): void

  addEventListener<K extends keyof IWebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: IWebSocketEventMap[K]) => any,
    options?: any
  ): void
}

export function WebSocketTransport(socket: IWebSocket): ScriptingTransport {
  const queue: string[] = []

  socket.addEventListener('open', function() {
    flush()
  })

  function flush() {
    if (socket.readyState === WebSocket.OPEN) {
      queue.forEach($ => socket.send($))
      queue.length = 0
    }
  }

  const api: ScriptingTransport = {
    onConnect(handler) {
      if (socket.readyState === socket.OPEN) {
        handler()
      }
      socket.addEventListener('open', () => handler(), { once: true })
    },
    onError(handler) {
      socket.addEventListener('error', (err: ErrorEvent) => handler(err.error))
    },
    onMessage(handler) {
      socket.addEventListener('message', (message: { data: any }) => {
        handler(message.data)
      })
    },
    sendMessage(message) {
      if (socket.readyState === socket.OPEN) {
        socket.send(message)
      } else {
        queue.push(message)
      }
    },
    close() {
      socket.close()
    }
  }

  return api
}
