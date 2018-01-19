import { ScriptingHost, BasePlugin, ExposedAPI } from '../../../lib/host';
import assert = require('assert');
import { Test } from './Commons';

export type IFuture<T> = Promise<T> & { resolve?: (x: T) => void, reject?: (x: Error) => void };

export type ITestInWorkerOptions = {
  log?: boolean;
  validateResult?: (result: any) => void;
  execute?: (worker: ScriptingHost) => void;
};

export function wait(ms: number): Promise<void> {
  return new Promise(ok => {
    setTimeout(ok, ms);
  });
}

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

export function testInWorker(file: string, options: ITestInWorkerOptions = {}) {
  it(file, async () => {
    const worker = await ScriptingHost.fromURL(file);

    if (options.log) {
      worker.setLogging({ logConsole: true });
    }

    options.execute && options.execute(worker);

    const result = await (worker.getPluginInstance(Test).waitForPass());

    options.validateResult && options.validateResult(result);

    worker.terminate();
  });
}
