/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import { ScriptingHost } from '../../dist/host';
import assert = require('assert');

describe('Basic scripting communication scenarios', function () {
  it('Should create a WebWorker from a URL', async () => {
    const scriptingHost = new ScriptingHost();
    const worker = await scriptingHost.loadScript('test/out/1.Echo.js');

    const randomNumber = Math.random();
    let receivedNumber = null;

    worker.setLogging({ logConsole: true, logEmit: true });

    worker.expose('MethodX', async (message) => {
      console.log('MethodX was triggered', message);
      return { number: randomNumber };
    });

    worker.expose('JumpBack', async (data) => {
      console.log('JumpBack was triggered', data);
      receivedNumber = data.number;
    });

    worker.notify('Start');

    await new Promise((ok) => {
      setTimeout(ok, 1000);
    });

    assert.equal(receivedNumber, randomNumber, 'exchanged numbers must match');
  });
});
