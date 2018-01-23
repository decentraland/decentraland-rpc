import { registerComponent, ComponentBase, exposeMethod } from '../../lib/host'

import * as assert from 'assert'
import { future, testInWorker } from './support/Helpers'

const aFuture = future()

@registerComponent('Debugger')
export class Debugger extends ComponentBase {
  @exposeMethod
  async enable() {
    return 1
  }
}

@registerComponent('Profiler')
export class Profiler extends ComponentBase {
  @exposeMethod
  async enable() {
    return 1
  }

  @exposeMethod
  async start() {
    setTimeout(() => {
      this.options.notify('ExecutionContextDestroyed')
    }, 16)
  }

  @exposeMethod
  async stop() {
    aFuture.resolve(true)
    return { data: 'noice!' }
  }
}

@registerComponent('Runtime')
export class Runtime extends ComponentBase {

  @exposeMethod
  async enable() {
    return 1
  }

  @exposeMethod
  async run() {
    return 1
  }
}

testInWorker('test/out/3.Class.js', {
  plugins: [Debugger, Profiler, Runtime],
  validateResult: async (result) => {
    assert.equal(await aFuture, true)
  }
})
