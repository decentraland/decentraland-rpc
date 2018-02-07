import { testSystem, TestableSystem } from './support/ClientHelpers'
import { inject } from '../../lib/client/index'

export class Interval extends TestableSystem {
  @inject('Test7') test7: any = null

  async doTest() {
    setInterval(async () => {
      if (await this.test7.isReady()) {
        await this.test7.doSomething()
      }
    }, 100)
  }
}

testSystem(Interval)
