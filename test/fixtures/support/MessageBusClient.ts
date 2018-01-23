import { EventDispatcher } from '../../../lib/common/core/EventDispatcher'
import { getPlugin } from '../../../lib/client'

export interface IMessageBusOptions {
}

export interface IMessage {
  event: string
  args: any[]
  sender: string
}

const MessageBusProxy = getPlugin('MessageBus')

export class MessageBusClient<T = any> extends EventDispatcher<T> {
  private broadcastIdentifier = `Broadcast_${this.id}`

  private constructor(protected api: any, protected id: string, protected busClientId: string) {
    super()
    api[`on${this.broadcastIdentifier}`]((message: IMessage) => {
      if (this.busClientId !== message.sender) {
        super.emit(message.event, ...message.args)
      }
    })
  }

  static async acquireChannel(channelName: string, options: IMessageBusOptions = {}) {
    const busId = Math.random().toString(36)
    const MessageBusApi = await MessageBusProxy

    const bus = await MessageBusApi.getChannel(channelName, busId, options)

    return new MessageBusClient(MessageBusApi, bus.id, busId)
  }

  emit(event: string, ...args: any[]) {
    this.api[this.broadcastIdentifier]({ event, args, sender: this.busClientId } as IMessage)
    super.emit(event, ...args)
  }
}
