import { EventDispatcher } from '../../lib/common/core/EventDispatcher'
import { SubscribableComponent, ComponentOptions, exposeMethod, registerComponent } from '../../lib/host'
import { testInWorker } from './support/Helpers';


class EventListener extends EventDispatcher {

  constructor() {
    super();
    window.addEventListener('customEvent', () => {
      this.handleEvent()
    })
  }

  handleEvent() {
    this.emit('customEvent', {})
  }

}

@registerComponent('eventController')
export class EventController extends SubscribableComponent {

  private listener: EventListener

  constructor(opts: ComponentOptions) {
    super(opts)
    this.listener = new EventListener
    var evt = new CustomEvent('customEvent', { detail: 'info' });

    setTimeout(() => {
      window.dispatchEvent(evt);      
    }, 1000);
  }


  @exposeMethod
  async subscribe(event: string) {
    this.listener.on(event, (e: any) => {
      this.options.notify('SubscribedEvent', {event, data: e})
    }) 
  }

}

describe('EventDispatcher', function () {
  testInWorker('test/out/11.EventSubscriber.js', {
    plugins: [EventController],
    log: true
  })
})
