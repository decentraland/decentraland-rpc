import { BasePlugin, ScriptingHost, ExposedAPI } from "../../../lib/host";
import { EventDispatcher, EventDispatcherBinding } from "../../../lib/common/core/EventDispatcher";
import { EventEmitter } from "events";

const messageBus = new EventDispatcher;

@ScriptingHost.registerPlugin('MessageBus')
export class MessageBusManager extends BasePlugin {
  joinedTo: EventDispatcherBinding[] = [];

  @BasePlugin.expose async getChannel(name, uid, options) {

    const id = (Math.random() * 100000000).toFixed(0);

    const key = 'Broadcast_' + id;

    this.joinedTo.push(
      messageBus.on(name, (message) => {
        try {
          this.options.notify(key, message);
        } catch (e) {
          console.error(e);
        }
      })
    );

    this.options.expose(key, (message) =>
      messageBus.emit(name, message)
    );

    return { id };
  }

  terminate() {
    super.terminate();
    this.joinedTo.forEach($ => $.off());
    this.joinedTo.length = 0;
  }
}
