import { wait } from './support/Helpers'
import { registerComponent, Component, ComponentSystem } from '../../lib/host'
import './support/MessageBusManager'

/**
 * This test validates that we are able to unmount workers that fail to respond to
 * the ping notification. This may happen if the worker is frozen due to a computationally expensive task.
 * It will finish (and pass) if the worker is successfully terminated.
 * Otherwise the test will timeout as isAlive() will keep returning true and thus the loop will continue.
 */

@registerComponent('Terminate')
export class Terminator extends Component {
  private lastPing: number = 0;
  
  constructor(opt: { componentName: string; on(event: string, handler: <A, O extends object>(params: O | A[]) => void): void; notify(event: string, params?: any): void; expose(event: string, handler: <A, O extends object>(params: O | A[]) => Promise<any>): void; }){
    super(opt)
    opt.on('Ping', () => this.lastPing = +new Date())
    this.lastPing = +new Date()
  }

  isAlive(): boolean {
    const time = (+new Date() - this.lastPing);
    return time < 1000;
  }
}

describe('Terminate', function () {

  it ('should kill the worker', async () => {
    const worker = await ComponentSystem.fromURL('test/out/6.GreedyWorker.js')
    worker.enable()
    const api = worker.getComponentInstance(Terminator)
    
    while(api.isAlive()) {
      console.log('it is alive')
      await wait(20)
    }
  
    console.log('ending interval')
    worker.unmount()
  })

})
