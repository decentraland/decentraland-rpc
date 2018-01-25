import { testSystem, TestableSystem, wait } from "./support/ClientHelpers";
import { inject } from "../../lib/client/index"
import * as assert from "assert"

export class RateLimited extends TestableSystem {
  @inject("RateLimiter") RateLimiter: any = null

  async doTest() {
    const { RateLimiter } = this

    let failed = false;

    for (let index = 0; index < 10; index++) {
      await wait(101)
      try {
        await RateLimiter.everyTenthOfSecond()
      } catch (e) {
        failed = true
      }
    }
    
    assert.equal(failed, false)

    for (let index = 0; index < 10; index++) {
      await wait(9)
      try {
        await RateLimiter.everyTenthOfSecond()
      } catch (e) {
        failed = true
      }
    }
    
    assert.equal(failed, true)
    
  }
}

testSystem(RateLimited)
false
