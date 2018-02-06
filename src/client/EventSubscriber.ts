import {
  EventDispatcher,
  EventDispatcherBinding
} from '../common/core/EventDispatcher'
import { ISubscribableComponent } from '../host/Component'

export class EventSubscriber extends EventDispatcher {
  private subscriptions: { [event: string]: number } = {}

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
    if (!this.subscriptions[event]) {
      this.component
        .subscribe(event)
        .then(() => {
          this.subscriptions[event] = this.subscriptions[event]
            ? this.subscriptions[event] + 1
            : 1
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
    if (this.subscriptions[event]) {
      // If we are removing the last event listener, remove it also from the component
      // this will keep listeners unrelated to the component intact
      if (this.subscriptions[event] === 1) {
        this.component
          .unsubscribe(event)
          .then(() => {
            delete this.subscriptions[event]
          })
          .catch(e => this.emit('error', e))
      } else {
        this.subscriptions[event]--
      }
    }
    return super.off.apply(this, [binding])
  }
}
