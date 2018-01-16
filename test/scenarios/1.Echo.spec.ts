
/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import { ScriptingHost, BasePlugin, ExposedAPI } from '../../dist/host';
import assert = require('assert');
import { future } from './Helpers';

it('1.Echo', async () => {
  const worker = await ScriptingHost.fromURL('test/out/1.Echo.js');

  const randomNumber = Math.random();
  const aFuture = future();

  worker.setLogging({ logConsole: true, logEmit: true });

  worker.expose('MethodX', async (message) => {
    return { number: randomNumber };
  });

  worker.expose('JumpBack', async (data) => {
    aFuture.resolve(data.number);
  });

  worker.enable();

  assert.equal(await aFuture, randomNumber, 'exchanged numbers must match');
});
