import { Test } from './ClientCommons';

export type IFuture<T> = Promise<T> & { resolve: (x: T) => void, reject: (x: Error) => void };

export function future<T = any>(): IFuture<T> {
  let resolver: (x: T) => void = (x: T) => { throw new Error("Error initilizing mutex"); };
  let rejecter: (x: Error) => void = (x: Error) => { throw x; };

  const promise: any = new Promise((ok, err) => {
    resolver = ok;
    rejecter = err;
  });

  promise.resolve = resolver;
  promise.reject = rejecter;

  return promise as IFuture<T>;
}

export function wait(ms: number): Promise<void> {
  return new Promise(ok => {
    setTimeout(ok, ms);
  });
}

export function test(fn: () => Promise<any>) {
  fn()
    .then((x) => Test.pass(x))
    .catch(x => {
      console.error('Test failed');
      console.error(x);
      return Test.fail(x);
    });
}

export function testToFail(fn: () => Promise<any>) {
  fn()
    .then((x) => {
      console.error('Test did not fail');
      console.error(x);
      return Test.fail(x);
    })
    .catch(x => {
      console.log(x);
      return Test.pass(x);
    });
}

export async function shouldFail(fn: () => Promise<any>, msg: string = 'shouldFail') {
  try {
    await fn();
    throw new Error(`${msg} - It did not fail.`);
  } catch (e) {
    if (!(e instanceof Error)) {
      throw new Error(`${msg} - Error thrown is not instance of Error`);
    }
    return 'DID_FAIL';
  }
}
