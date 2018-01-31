import { registerComponent, Component, exposeMethod, throttle } from '../../lib/host'
import { testInWorker } from './support/Helpers';

@registerComponent('Throttling')
export class Throttling extends Component {
  private calls: number = 0;

  @throttle(5, 100)
  @exposeMethod
  async fiveEveryHundredMilliseconds() {
    console.log('five every 100ms', this.calls)
    this.calls++
  }
}
  
describe('Throttling', function () {
  testInWorker('test/out/10.Throttling.js', {
    plugins: [Throttling],
    log: true
  })
})
