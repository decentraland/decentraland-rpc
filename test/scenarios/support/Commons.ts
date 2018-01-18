import { BasePlugin, ExposedAPI, ScriptingHost } from "../../../lib/host";
import { future } from "./Helpers";

export class Logger extends BasePlugin {
  getApi(): ExposedAPI {
    return {
      async error(message) {
        console.error.call(console, message);
      },
      async log(message) {
        console.log.call(console, message);
      },
      async warn(message) {
        console.warn.call(console, message);
      },
      async info(message) {
        console.info.call(console, message);
      }
    };
  }
}

ScriptingHost.registerPlugin('Logger', Logger);

export class Methods extends BasePlugin {
  store = {};

  getApi(): ExposedAPI {
    return {
      setValue: async (opt: { key: string, value: any }) => {
        this.store[opt.key] = opt.value;
      },
      getValue: async (key: string) => {
        return this.store[key];
      },
      async enable() {
        return 1;
      },
      async getRandomNumber() {
        return Math.random();
      },
      async fail() {
        throw new Error('A message');
      },
      async receiveObject(obj: object) {
        if (typeof obj != 'object') {
          throw new Error('Did not receive an object');
        }
        return { received: obj };
      },
      async failsWithoutParams() {
        if (arguments.length != 1) {
          throw new Error(`Did not receive an argument. got: ${JSON.stringify(arguments)}`);
        }
        return { args: arguments };
      },
      async failsWithParams() {
        if (arguments.length != 0) {
          throw new Error(`Did receive arguments. got: ${JSON.stringify(arguments)}`);
        }
        return { args: arguments };
      }
    };
  }
}

ScriptingHost.registerPlugin('Methods', Methods);

export class Test extends BasePlugin {
  future = future<{ pass: boolean, arg: any }>();

  async waitForPass() {
    const result = await this.future;

    if (!result.pass) {
      throw Object.assign(new Error('WebWorker test failed. The worker did not report error data.'), result.arg || {});
    }

    return result.arg;
  }

  getApi(): ExposedAPI {
    return {
      fail: async (arg) => {
        this.future.resolve({ pass: false, arg });
      },

      pass: async (arg) => {
        this.future.resolve({ pass: true, arg });
      }
    };
  }
}

ScriptingHost.registerPlugin('Test', Test);
