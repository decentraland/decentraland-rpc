/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import { ScriptingHost } from '../../dist/host';
import assert = require('assert');

describe('Basic scripting communication scenarios', function () {
  it('1.Echo', async () => {
    const scriptingHost = new ScriptingHost();
    const worker = await scriptingHost.loadScript('test/out/1.Echo.js');

    const randomNumber = Math.random();
    let receivedNumber = null;

    worker.setLogging({ logConsole: true, logEmit: true });

    worker.expose('MethodX', async (message) => {
      return { number: randomNumber };
    });

    worker.expose('JumpBack', async (data) => {
      receivedNumber = data.number;
    });

    worker.enable();

    await new Promise((ok) => {
      setTimeout(ok, 1000);
    });

    assert.equal(receivedNumber, randomNumber, 'exchanged numbers must match');
  });

  it('2.Debugger', async () => {
    const scriptingHost = new ScriptingHost();
    const worker = await scriptingHost.loadScript('test/out/2.Debugger.js');

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
});
