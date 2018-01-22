import { EventDispatcher } from "../../../lib/common/core/EventDispatcher";
import { getPlugin } from '../../../lib/client';

export interface IMessageBusOptions {
}

export interface IMessage {
  event: string;
  args: any[];
  sender: string;
}

const MessageBusApi = getPlugin('MessageBus') as {
  getChannel(channelName: string, uid: string, options: IMessageBusOptions): Promise<{ id: string }>;
  [key: string]: Function;
};

export class MessageBusClient<T = any> extends EventDispatcher<T> {
  private broadcastIdentifier = `Broadcast_${this.id}`;

  private constructor(protected id: string, protected busClientId: string) {
    super();

    MessageBusApi[`on${this.broadcastIdentifier}`]((message: IMessage) => {
      if (this.busClientId != message.sender) {
        super.emit(message.event, ...message.args);
      }
    });
  }

  emit(event: string, ...args: any[]) {
    MessageBusApi[this.broadcastIdentifier]({ event, args, sender: this.busClientId } as IMessage);
    super.emit(event, ...args);
  }

  static async acquireChannel(channelName: string, options: IMessageBusOptions = {}) {
    const busId = Math.random().toString(36);

    const bus = await MessageBusApi.getChannel(channelName, busId, options);

    return new MessageBusClient(bus.id, busId);
  }
}
