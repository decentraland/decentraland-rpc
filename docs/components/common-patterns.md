# Common Patterns
The following is a list of common patterns used to solve frequent problems, they are the recommended way to do things but are not by any means the only ones. Custom solutions are encouraged and so are Pull Requests!

## Subscribable Components
Tipically there is a need to subscribe to a buch on arbitraty events from within a System. These events are often generated outside of the scope of the Component, so creating and disposing listeners across contexts becomes complicated. In this scenario we will treat the Component as a "Controller", the System as the "Subscriber" and another module as the "Event Dispatcher".

Given the following Event Dispatcher we can allow any amount of Components (and other modules) to subscribe to a domain-specific event:

```ts
class EventListener extends EventDispatcher {

  constructor() {
    super();
    const evt = new CustomEvent('customEvent', { detail: 'test' })
    
    window.addEventListener('customEvent', (e) => {
      this.handleEvent(e.type, (e as CustomEvent).detail)      
    })

    setInterval(() => {
      window.dispatchEvent(evt)
    }, 1000)
  }

  handleEvent(type: string, detail?: string) {
    this.emit(type, { data: { message: detail }})
  }

}
```

Extending the `EventDispatchter` class is the recommended way to allow the communication between the EventListener class and any other Component. The `emit()` method is used to notify the Component, and the `on()` method is provided as a way to register a new event listener.

Similarly, the component can extend the `SubscribableComponent` class as it needs to implement the `subscribe()`and `unsubscribe()` methods to allow Systems to subscribe to events via an [EventSubscriber](../systems/common-patterns.md). In this context, Components become intermediaries between the two parts:

```
@registerComponent('eventController')
export class EventController extends SubscribableComponent {

  private listener: EventListener
  private bindings: EventDispatcherBinding[] = []

  constructor(opts: ComponentOptions) {
    super(opts)
    this.listener = new EventListener
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
```

Keep in mind that the implementation of subscription related method are left entirely up to the developer. In the example above we keep an array of `EventDispatcherBinding` to remove listeners related to this specific Component when the `unsubscribe()` method is called (many Component could interact with a single EventDispatcher).
