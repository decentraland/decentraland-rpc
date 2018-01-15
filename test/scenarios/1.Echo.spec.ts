
/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import { ScriptingHost, BasePlugin, ExposedAPI } from '../../dist/host';
import assert = require('assert');

it('1.Echo', async () => {
  const worker = await ScriptingHost.fromURL('test/out/1.Echo.js');

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
