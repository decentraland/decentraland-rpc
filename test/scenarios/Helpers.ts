export type IFuture<T> = Promise<T> & { resolve?: (x: T) => void };

export function future<T = any>(): IFuture<T> {
  let resolver: (x: T) => void = (x: T) => { throw new Error("Error initilizing mutex"); };

  const promise: IFuture<T> = new Promise(ok => resolver = ok);

  promise.resolve = resolver;

  return promise;
}
