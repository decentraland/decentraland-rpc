/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import { ScriptingHost, BasePlugin, ExposedAPI } from '../../dist/host';
import assert = require('assert');
import { future } from './Helpers';

it('2.Debugger', async () => {
  const worker = await ScriptingHost.fromURL('test/out/2.Debugger.js');

  let aFuture = future();

  // worker.setLogging({ logConsole: true, logEmit: true });

  const api = worker.api();

  const enable = () => { };

  api.Debugger.expose({ enable });
  api.Profiler.expose({ enable });

  api.Runtime.expose({
    enable,
    run() { }
  });

  api.Profiler.expose({
    enable,
    start() {
      setTimeout(() => {
        api.Runtime.emitExecutionContextDestroyed();
      }, 16);
    },
    stop() {
      aFuture.resolve(333);
      return { data: "noice!" };
    }
  });

  worker.enable();

  assert.equal(await aFuture, 333, 'Did stop should have been called.');
});
