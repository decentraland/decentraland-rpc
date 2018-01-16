/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import { ScriptingHost, BasePlugin, ExposedAPI } from '../../dist/host';
import assert = require('assert');
import { future } from './Helpers';
import { Test } from './Commons';

describe('5.Methods', function () {
  it('5.Methods', async () => {
    const worker = await ScriptingHost.fromURL('test/out/5.Methods.js');
    worker.setLogging({ logConsole: true, logEmit: true });
    await (worker.getPluginInstance(Test).waitForPass());
  });
});
