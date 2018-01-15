/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import { ScriptingHost, BasePlugin, ExposedAPI } from '../../dist/host';
import assert = require('assert');

it('2.Debugger', async () => {
  const worker = await ScriptingHost.fromURL('test/out/2.Debugger.js');

  let didStop = false;

  worker.setLogging({ logConsole: true, logEmit: true });

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
      didStop = true;
      return { data: "noice!" };
    }
  });

  worker.enable();

  await new Promise((ok) => {
    setTimeout(ok, 1000);
  });

  assert.equal(didStop, true, 'Did stop should have been called.');
});
