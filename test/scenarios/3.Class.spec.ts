/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import { ScriptingHost, BasePlugin, ExposedAPI } from '../../dist/host';
import assert = require('assert');

let didStop = false;

class Debugger extends BasePlugin {
  getApi(): ExposedAPI {
    return {
      async enable() {
        return 1;
      }
    };
  }
}

class Profiler extends BasePlugin {
  getApi(): ExposedAPI {
    return {
      enable: async () => {
        return 1;
      },
      start: async () => {
        setTimeout(() => {
          this.notify('ExecutionContextDestroyed');
        }, 16);
      },
      stop: async () => {
        didStop = true;
        return { data: "noice!" };
      }
    };
  }
}

class Runtime extends BasePlugin {
  getApi() {
    return {
      async enable() {
        return 1;
      },
      async run() {
        return 1;
      }
    };
  }
}

it('3.Class (with scripting host plugins)', async () => {
  ScriptingHost.registerPlugin('Debugger', Debugger);
  ScriptingHost.registerPlugin('Profiler', Profiler);
  ScriptingHost.registerPlugin('Runtime', Runtime);

  const worker = await ScriptingHost.fromURL('test/out/3.Class.js');

  worker.setLogging({ logConsole: true, logEmit: true });

  await new Promise((ok) => {
    setTimeout(ok, 1000);
  });

  assert.equal(didStop, true, 'Did stop should have been called.');
});
