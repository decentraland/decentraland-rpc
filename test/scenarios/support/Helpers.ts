import { ScriptingHost } from '../../../lib/host'
import { Test } from './Commons'
import { WebWorkerTransport } from '../../../lib/client'

export type IFuture<T> = Promise<T> & {
  resolve: (x: T) => void
  reject?: (x: Error) => void
}

export type ITestInWorkerOptions = {
  log?: boolean
  validateResult?: (result: any, worker: ScriptingHost) => void
  execute?: (worker: ScriptingHost) => void
  plugins?: any[]
  sendEncoding?: 'JSON' | 'msgpack'
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

export function testInWorker(file: string, options: ITestInWorkerOptions = {}) {
  it(file, async () => {
    const worker = new Worker(file)
    const system = await ScriptingHost.fromTransport(WebWorkerTransport(worker))

    if (options.sendEncoding) {
      system.sendEncoding = options.sendEncoding
    }

    if (options.log) {
      system.setLogging({ logConsole: true })
    }

    options.plugins && options.plugins.forEach($ => system.getAPIInstance($))

    system.enable()

    options.execute && options.execute(system)

    const TestPlugin = system.getAPIInstance(Test)

    if (!TestPlugin) throw new Error('Cannot get the Test plugin instance')

    const result = await TestPlugin.waitForPass()

    options.validateResult && options.validateResult(result, system)

    system.unmount()
  })
}
