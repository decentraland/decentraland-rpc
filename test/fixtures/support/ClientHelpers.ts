import { API } from '../../../lib/client';

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



export function wait(ms: number): Promise<void> {
  return new Promise(ok => {
    setTimeout(ok, ms);
  });
}



export function test(fn: () => Promise<any>) {
  fn()
    .then((x) => API.Test.pass(x))
    .catch(x => {
      console.log(x);
      return API.Test.fail(x.data);
    });
}

export async function shouldFail(fn: () => Promise<any>, msg: string = 'shouldFail') {
  try {
    const result = await fn();
    throw new Error(`${msg} - It did not fail.`);
  } catch (e) {
    if (!(e instanceof Error)) {
      throw new Error(`${msg} - Error thrown is not instance of Error`);
    }
    return 'DID_FAIL';
  }
}
