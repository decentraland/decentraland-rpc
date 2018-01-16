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
