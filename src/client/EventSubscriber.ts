import { EventDispatcher } from '../common/core/EventDispatcher'
import { ISubscribableComponent } from '../host/Component'

export class EventSubscriber extends EventDispatcher {
  private subscriptions: string[] = []

  constructor(private component: ISubscribableComponent) {
    super()

    component.onSubscribedEvent((data: any) => {
      console.log('>> got it')
      super.emit(data.event, data)
    })
  }

  onEvent(event: string, handler: any) {
    if (!this.subscriptions.includes(event)) {
      this.component
        .subscribe(event)
        .then(() => {
          this.subscriptions.push(event)
        })
        .catch(e => console.log(`Error subscribing`, e))
    }
    return super.on.apply(this, [event, handler])
  }
}
