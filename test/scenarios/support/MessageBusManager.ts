import { BasePlugin, ScriptingHost, ExposedAPI } from "../../../dist/host/index";

const globalBuses: { [key: string]: any } = {};

export class MessageBusManager extends BasePlugin {
  getApi(): ExposedAPI {
    return {
      async joinChannel({ name, id }: { name: string, id: string }) {

      }
    };
  }
}

ScriptingHost.registerPlugin('MessageBus', MessageBusManager);
