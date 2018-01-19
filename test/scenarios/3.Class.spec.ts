/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import { ScriptingHost, BasePlugin, ExposedAPI, exposeMethod } from '../../lib/host';
import assert = require('assert');
import { future, testInWorker } from './support/Helpers';

const aFuture = future();

class Debugger extends BasePlugin {
  @exposeMethod
  async enable() {
    return 1;
  }
}

class Profiler extends BasePlugin {
  @exposeMethod
  async enable() {
    return 1;
  }

  @exposeMethod
  async start() {
    setTimeout(() => {
      this.options.notify('ExecutionContextDestroyed');
    }, 16);
  }

  @exposeMethod
  async stop() {
    aFuture.resolve(true);
    return { data: "noice!" };
  }
}

class Runtime extends BasePlugin {
  @exposeMethod
  async enable() {
    return 1;
  }

  @exposeMethod
  async run() {
    return 1;
  }
}

ScriptingHost.registerPlugin('Debugger', Debugger);
ScriptingHost.registerPlugin('Profiler', Profiler);
ScriptingHost.registerPlugin('Runtime', Runtime);

testInWorker('test/out/3.Class.js', {
  validateResult: async (result) => {
    assert.equal(await aFuture, true);
  }
});
