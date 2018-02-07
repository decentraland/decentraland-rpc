import { testSystem, TestableSystem } from './support/ClientHelpers'
import { inject } from '../../lib/client/index'

export class TestMethods extends TestableSystem {
  @inject('Test7') test7: any = null

  async doTest() {
    await this.test7.setNumber(Math.random())
  }
}

testSystem(TestMethods)
