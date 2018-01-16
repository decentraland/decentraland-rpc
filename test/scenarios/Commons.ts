import { BasePlugin, ExposedAPI, ScriptingHost } from "../../dist/host";
import { future } from "./Helpers";

export class Logger extends BasePlugin {
  getApi(): ExposedAPI {
    return {
      async error(...args) {
        console.error.apply(console, args);
      },
      async log(...args) {
        console.log.apply(console, args);
      },
      async warn(...args) {
        console.warn.apply(console, args);
      },
      async info(...args) {
        console.info.apply(console, args);
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
  future = future<{ pass: boolean, args: any[] }>();

  async waitForPass() {
    const result = await this.future;

    if (!result.pass) {
      if (result.args.length == 1) {
        throw Object.assign(new Error(), result.args[0]);
      }
      throw result.args;
    }
  }

  getApi(): ExposedAPI {
    return {
      fail: async (...args) => {
        this.future.resolve({ pass: false, args: args });
      },

      pass: async (...args) => {
        this.future.resolve({ pass: true, args: args });
      }
    };
  }
}

ScriptingHost.registerPlugin('Test', Test);
