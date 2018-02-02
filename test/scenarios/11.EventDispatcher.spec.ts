import { EventDispatcher, EventDispatcherBinding } from '../../lib/common/core/EventDispatcher'
import { SubscribableComponent, ComponentOptions, exposeMethod, registerComponent } from '../../lib/host'
import { testInWorker } from './support/Helpers';
import * as assert from 'assert'

class EventListener extends EventDispatcher {

  private count: number = 0

  constructor() {
    super();
    const evt = new CustomEvent('customEvent', { detail: 'test' })
    
    window.addEventListener('customEvent', (e) => {
      this.handleEvent(e.type, (e as CustomEvent).detail)      
    })

    this.on('customEvent', () => {
      this.count++
    })

    setInterval(() => {
      window.dispatchEvent(evt)
    }, 100)
  }

  handleEvent(type: string, detail?: string) {
    this.emit(type, detail ? { data: { message: detail }} : {})
  }

  validateCount() {
    if (this.count <= 10) {
      assert.fail(`EventListener's binding must not be removed`)
    }
  }

}

@registerComponent('eventController')
export class EventController extends SubscribableComponent {

  private listener: EventListener
  private bindings: EventDispatcherBinding[] = []

  constructor(opts: ComponentOptions) {
    super(opts)
    this.listener = new EventListener

    this.options.on('Validate', () => {
      this.listener.validateCount()
    })
  }

  @exposeMethod
  async subscribe(event: string) {
    const binding = this.listener.on(event, (e: any) => {
      this.options.notify('SubscribedEvent', {event, data: e.data})
    })

    this.bindings.push(binding)
  }
  
  @exposeMethod
  async unsubscribe(event: string) {
    this.bindings
      .filter(binding => binding.event === event)
      .forEach(binding => binding.off())
  }
}

describe('EventDispatcher', function () {
  testInWorker('test/out/11.EventSubscriber.js', {
    plugins: [EventController],
    log: true
  })
})
