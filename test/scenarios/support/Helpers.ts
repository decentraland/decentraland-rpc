import { ScriptingHost, BasePlugin, ExposedAPI } from '../../../lib/host';
import assert = require('assert');
import { Test } from './Commons';

export type IFuture<T> = Promise<T> & { resolve?: (x: T) => void, reject?: (x: Error) => void };

export function future<T = any>(): IFuture<T> {
  let resolver: (x: T) => void = (x: T) => { throw new Error("Error initilizing mutex"); };
  let rejecter: (x: Error) => void = (x: Error) => { throw x; };

  const promise: IFuture<T> = new Promise((ok, err) => {
    resolver = ok;
    rejecter = err;
  });

  promise.resolve = resolver;
  promise.reject = rejecter;

  return promise;
}


export function testInWorker(file: string, cb?: (result) => void, log = false) {
  it(file, async () => {
    const worker = await ScriptingHost.fromURL(file);

    if (log) {
      worker.setLogging({ logConsole: true });
    }

    const result = await (worker.getPluginInstance(Test).waitForPass());

    cb && cb(result);

    worker.terminate();
  });
}
