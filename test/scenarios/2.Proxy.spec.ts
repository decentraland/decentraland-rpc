/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import { ScriptingHost, BasePlugin, ExposedAPI } from '../../lib/host';
import assert = require('assert');
import { future } from './support/Helpers';
import { Test } from './support/Commons';

it('test/out/2.Proxy.js', async () => {
  const worker = await ScriptingHost.fromURL('test/out/2.Proxy.js');

  let aFuture = future();

  // worker.setLogging({ logConsole: true, logEmit: true });

  const api = worker.api();

  const enable = () => { };

  api.xDebugger.expose({ enable });
  api.xProfiler.expose({ enable });

  api.xRuntime.expose({
    enable,
    run() { }
  });

  api.xProfiler.expose({
    enable,
    start() {
      setTimeout(() => {
        api.xRuntime.emitExecutionContextDestroyed();
      }, 16);
    },
    stop() {
      aFuture.resolve(333);
      return { data: "noice!" };
    }
  });

  worker.enable();

  assert.equal(await aFuture, 333, 'Did stop should have been called.');

  await (worker.getPluginInstance(Test).waitForPass());

  worker.terminate();
});
