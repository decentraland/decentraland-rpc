import { testInWorker } from './support/Helpers'
import { Logger, Methods, Test } from './support/Commons'
import { registerComponent, Component, exposeMethod, ComponentSystem } from '../../lib/host'
import * as assert from 'assert'

@registerComponent('Test7')
export class Test7 extends Component {
  receivedNumber: number = -1
  status: string = ''

  @exposeMethod
  async setNumber(num: number) {
    this.receivedNumber = num
  }

  @exposeMethod
  async setStatus() {
    this.status = 'ready'
  }

  @exposeMethod
  async doSomething(): Promise<any> {
    if (this.status === 'ready') {
      return true
    }

    throw new Error('Component was not ready yet')
  }

  @exposeMethod
  async isReady(): Promise<boolean> {
    return this.status === 'ready'
  }
}

describe('Class based systems', function() {
  testInWorker('test/out/7.0.MethodsInjection.js', {
    plugins: [Logger, Methods, Test],
    log: false
  })

  testInWorker('test/out/7.0.MethodsInjection.js?without_preload', {
    plugins: [],
    log: false
  })

  testInWorker('test/out/7.1.InheritInjections.js', {
    plugins: [],
    log: false
  })

  testInWorker('test/out/7.2.ValidateValuesInServer.js', {
    plugins: [],
    log: false,
    validateResult: (result: any, worker: ComponentSystem) => {
      const test7 = worker.getComponentInstance(Test7)
      assert.notEqual(test7.receivedNumber, -1)
    }
  })

  testInWorker('test/out/7.3.Interval.js', {
    plugins: [],
    log: false,
    validateResult: (result: any, worker: ComponentSystem) => {
      const test7 = worker.getComponentInstance(Test7)

      setTimeout(() => {
        test7.setStatus()
      }, 500)
    }
  })
})
