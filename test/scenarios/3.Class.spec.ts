/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import { ScriptingHost, BasePlugin, ExposedAPI } from '../../lib/host';
import assert = require('assert');
import { future, testInWorker } from './support/Helpers';

const aFuture = future();

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
        aFuture.resolve(true);
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
ScriptingHost.registerPlugin('Debugger', Debugger);
ScriptingHost.registerPlugin('Profiler', Profiler);
ScriptingHost.registerPlugin('Runtime', Runtime);

testInWorker('test/out/3.Class.js', {
  validateResult: async (result) => {
    assert.equal(await aFuture, true);
  },
  log: true
});
