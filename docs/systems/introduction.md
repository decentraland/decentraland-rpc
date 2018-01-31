# Introduction

Systems contain custom logic that is executed outside of the context of the [Component System](../components/component-system.md). They can run either locally using the Web Worker transport, or in another server through HTTP Requests/Web Sockets. Systems communicate with Components through JSON-RPC and several abstractions are provided to make loading and messaging Components a simple task.

## A basic System

```ts
class ExampleSystems extends System {
  @inject('Pinger')
  pinger: Pinger

  systemDidEnable() {
    await this.pinger.getLastPing()
  }
}
```

Following the example started in the [Components ](../components/introduction.md), the System above emits a Ping message and request a value from an exposed method.

Systems can load Components using the `@inject` decorator by specifying the name registered in the Component System. Additional types for that Component must be created and exported separately.

## Sending/Receiving notifications
A component subscribe to notifications by passing a callback to a method related to that specific notification. Te `on` prefix is used to identify methods that provide subscriptions. These methods are not defined in the Component, but instead are processed on runtime and are automatically associated to the corresponding notification:

```ts
class ExampleSystems extends System {
  @inject('Pinger')
  pinger: Pinger

  systemDidEnable() {
    this.pinger.onPong(() => {
      console.log('Pong!')
    })
  }
}
```

In the example above, the `onPong` method refers to the `ping` notification emitted by the Pinger Component.

A System can send notifications to the client in a similar way by calling a method beggining with the `emit` prefix followed by the notification identifier:

```ts
class ExampleSystems extends System {
  @inject('Pinger')
  pinger: Pinger

  systemDidEnable() {
    const { pinger } = this
    
    setInterval(() => {
      this.emitPing()
    }, 1000)
    
    pinger.onPong(() => {
      console.log('Pong!')
    })
  }
}
```
