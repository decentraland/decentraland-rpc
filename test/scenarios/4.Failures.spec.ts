/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import { ScriptingHost, BasePlugin, ExposedAPI } from '../../dist/host';
import assert = require('assert');
import { future } from './Helpers';
import { Test } from './Commons';

it('4.Failures', async () => {
  const worker = await ScriptingHost.fromURL('test/out/4.Failures.js');

  // worker.setLogging({ logConsole: true, logEmit: true });

  const result = await (worker.getPluginInstance(Test).future);

  assert(result.pass, 'It must pass');
  assert.equal(result.args[0], 'A message', 'It should have failed bouncing failing the message');
});
