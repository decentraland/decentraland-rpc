import {
  System,
  Transports,
  SystemTransport,
  inject
} from '../../../lib/client/index'
import { WebWorkerTransport } from '../../../lib/client/transports/WebWorker'
import { Test } from '../../scenarios/support/Commons'

export abstract class TestableSystem extends System {
  @inject('Test') testComponent: Test | null = null

  private didFail: Error | null = null

  constructor(a: SystemTransport) {
    super(a)

    this.on('error', (e: Error) => {
      this.didFail = e
      if (this.testComponent) {
        this.testComponent.fail(e)
      }
    })
  }

  pass(result?: any) {
    this.testComponent!.pass(result)
    this.emit('passed', result)
  }

  fail(error: any) {
    this.emit('error', error)
  }

  abstract doTest(): Promise<void>

  async systemDidEnable() {
    if (this.didFail) {
      this.testComponent!.fail(this.didFail)
      return
    }

    try {
      this.pass(await this.doTest())
    } catch (e) {
      this.fail(e)
    }
  }
}

export type IFuture<T> = Promise<T> & {
  resolve: (x: T) => void
  reject: (x: Error) => void
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

export function wait(ms: number): Promise<void> {
  return new Promise(ok => {
    setTimeout(ok, ms)
  })
}

export function test(fn: (system: System) => Promise<any>) {
  const ScriptingClient = new System(Transports.WebWorker())

  ScriptingClient.loadComponents(['Test'])
    .then(({ Test }) =>
      fn(ScriptingClient)
        .then(x => Test.pass(x))
        .catch(x => {
          console.error('Test failed')
          console.error(x)
          return Test.fail(x)
        })
    )
    .catch(x => console.error(x))
}

export function testToFail(fn: (system: System) => Promise<any>) {
  const ScriptingClient = new System(Transports.WebWorker())

  ScriptingClient.loadComponents(['Test']).then(({ Test }) =>
    fn(ScriptingClient)
      .then(x => {
        console.error('Test did not fail')
        console.error(x)
        return Test.fail(x)
      })
      .catch(x => {
        console.log(x)
        return Test.pass(x)
      })
  )
}

export function testSystem(system: {
  new (transport: SystemTransport): TestableSystem
}) {
  return new system(WebWorkerTransport())
}

export async function shouldFail(
  fn: () => Promise<any>,
  msg: string = 'shouldFail'
) {
  try {
    await fn()
    throw new Error(`${msg} - It did not fail.`)
  } catch (e) {
    if (!(e instanceof Error)) {
      throw new Error(`${msg} - Error thrown is not instance of Error`)
    }
    return 'DID_FAIL'
  }
}
