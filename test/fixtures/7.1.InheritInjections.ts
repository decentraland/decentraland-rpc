import * as assert from 'assert'
import { testSystem, shouldFail, TestableSystem } from './support/ClientHelpers'
import { Methods } from './support/ClientCommons'
import { inject, getInjectedComponents } from '../../lib/client/index'

export class BaseTestMethods extends TestableSystem {
  @inject Methods: Methods | null = null

  async doTest() {
    throw new Error('This should be overwritten and never called')
  }
}

export class TestMethods extends BaseTestMethods {
  @inject Logger: any = null
  @inject Test: any = null

  async doTest() {
    assert.deepEqual(
      Array.from(getInjectedComponents(this)).sort(),
      ['Test', 'Methods', 'Logger'].sort()
    )

    if (!this.Methods) {
      throw new Error('Methods was not loaded')
    }

    if (!this.Logger) {
      throw new Error('Logger was not loaded')
    }

    if (!this.Test) {
      throw new Error('Test was not loaded')
    }

    const Methods = this.Methods

    assert.equal(await Methods.enable(), 1)
    assert.equal(typeof await Methods.getRandomNumber(), 'number')
    assert((await Methods.getRandomNumber()) > 0)

    const sentObject = {
      x: await Methods.getRandomNumber()
    }

    assert.deepEqual(await Methods.receiveObject(sentObject), {
      received: sentObject
    })

    await Methods.failsWithoutParams(1)
    await Methods.failsWithParams()

    await shouldFail(() => Methods.failsWithoutParams(), 'failsWithoutParams')
    await shouldFail(() => Methods.failsWithParams(1), 'failsWithParams')

    const sentElements = [1, true, null, false, 'xxx', { a: null }]

    assert.deepEqual(await Methods.bounce(...sentElements), sentElements)

    console.log('If you see this console.log, it did work')
  }
}

testSystem(TestMethods)
