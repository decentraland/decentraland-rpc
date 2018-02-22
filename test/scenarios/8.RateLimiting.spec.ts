import { registerComponent, Component, exposeMethod, rateLimit } from '../../lib/host'
import { testInWorker } from './support/Helpers'

@registerComponent('RateLimiter')
export class RateLimiter extends Component {
  private calls: number = 0

  @rateLimit(100)
  @exposeMethod
  async everyTenthOfSecond() {
    console.log('ten per second', this.calls)
    this.calls++
  }
}

describe('RateLimiter', function() {
  testInWorker('test/out/8.RateLimiting.js', {
    plugins: [RateLimiter],
    log: true
  })
})
