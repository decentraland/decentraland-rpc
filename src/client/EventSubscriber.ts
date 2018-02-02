import { EventDispatcher, EventDispatcherBinding } from '../common/core/EventDispatcher'
import { ISubscribableComponent } from '../host/Component'

export class EventSubscriber extends EventDispatcher {
  private subscriptions: string[] = []

  constructor(private component: ISubscribableComponent) {
    super()

    component.onSubscribedEvent((data: any) => {
      super.emit(data.event, data)
    })
  }

  /**
   * Registers a new listener for an specific event.
   * @param event The name of the event
   * @param handler A handler which be called each time the event is received
   */
  addEventListener(event: string, handler: any) {
    if (!this.subscriptions.includes(event)) {
      this.component
        .subscribe(event)
        .then(() => {
          this.subscriptions.push(event)
        })
        .catch(e => this.emit('error', e))
    }
    return super.on.apply(this, [event, handler])
  }

  /**
   * Removes a listener for an specific event
   * @param event The name of the event
   * @param binding A reference to a binding returned by a previous `addEventListener` call
   */
  removeEventListener(event: string, binding: EventDispatcherBinding) {
    const index = this.subscriptions.indexOf(event)
    if (index > -1) {
      this.component.unsubscribe(event)
      .then(() => {
        this.subscriptions.splice(index, 1)
      })
      .catch(e => this.emit('error', e))
    }
    return super.off.apply(this, [binding])
  }
}
