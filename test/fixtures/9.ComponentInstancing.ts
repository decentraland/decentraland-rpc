import { testSystem, TestableSystem } from './support/ClientHelpers'
import { inject } from '../../lib/client/index'
import * as assert from 'assert'

export class ComponentInstancing extends TestableSystem {
  @inject('Instancer') Instancer: any = null

  async doTest() {
    const msg = await this.Instancer.doSomething()
    assert.equal(msg, 'Hello World')
  }
}

testSystem(ComponentInstancing)
