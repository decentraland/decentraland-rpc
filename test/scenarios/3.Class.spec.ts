import { BasePlugin, exposeMethod, registerPlugin } from '../../lib/host'
import * as assert from 'assert'
import { future, testInWorker } from './support/Helpers'

const aFuture = future()

@registerPlugin('Debugger')
export class Debugger extends BasePlugin {
  @exposeMethod
  async enable() {
    return 1
  }
}

@registerPlugin('Profiler')
export class Profiler extends BasePlugin {
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

@registerPlugin('Runtime')
export class Runtime extends BasePlugin {

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
