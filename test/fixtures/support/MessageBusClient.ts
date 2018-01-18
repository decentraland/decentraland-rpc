import { EventDispatcher } from "../../../dist/host";
import { ScriptingClient } from '../../../dist/client';

export interface IMessageBusOptions {
}

export class MessageBusClient extends EventDispatcher<any> {
  private _busIdentifier = `MessageBus.${this.id}.message`;

  private constructor(protected id: string, protected _localId: string) {
    super();
    ScriptingClient.on(this._busIdentifier, (data) => {
      this.emit(data.name, data.payload);
    });
  }

  notify(name: string, payload?: any) {
    ScriptingClient.notify(this._busIdentifier, { name, payload, sender: this._localId });
  }

  static async aquireChannel(name: string, options: IMessageBusOptions = {}) {
    const busId = Math.random().toString();

    const bus = await ScriptingClient.call('MessageBus.joinChannel', { name, id: busId, options });

    return new MessageBusClient(bus.id, busId);
  }
}
