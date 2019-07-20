import { ScriptingHost } from '../../../lib/host'

export type IFuture<T> = Promise<T> & {
  resolve: (x: T) => void
  reject?: (x: Error) => void
}

export type ITestInWorkerOptions = {
  log?: boolean
  validateResult?: (result: any, worker: ScriptingHost) => void
  execute?: (worker: ScriptingHost) => void
  plugins?: any[]
}

export function wait(ms: number): Promise<void> {
  return new Promise(ok => {
    setTimeout(ok, ms)
  })
}

export function future<T = any>(): IFuture<T> {
  let resolver: (x: T) => void = (x: T) => {
    throw new Error('Error initilizing mutex')
  }
  let rejecter: (x: Error) => void = (x: Error) => {
    throw x
  }

  const promise: any = new Promise((ok, err) => {
    resolver = ok
    rejecter = err
  })

  promise.resolve = resolver
  promise.reject = rejecter

  return promise as IFuture<T>
}
