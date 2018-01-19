
/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import { ScriptingHost, BasePlugin, ExposedAPI } from '../../lib/host';
import assert = require('assert');
import { future } from './support/Helpers';

it('test/out/1.Echo.js', async () => {
  const worker = await ScriptingHost.fromURL('test/out/1.Echo.js');

  const randomNumber = Math.random();
  const aFuture = future();

  // worker.setLogging({ logConsole: true, logEmit: true });

  worker.expose('MethodX', async (message) => {
    return { number: randomNumber };
  });

  worker.expose('JumpBack', async (data) => {
    aFuture.resolve(data.number);
  });

  assert.equal(await aFuture, randomNumber, 'exchanged numbers must match');

  worker.terminate();
});
