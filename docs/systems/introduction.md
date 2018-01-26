# Introduction

Systems contain custom logic that is executed outside of the context of the [Component System](../components/component-system.md). They can run either locally using the Web Worker transport, or in another server through HTTP Requests/Web Sockets. Systems communicate with Components through JSON-RPC and several abstractions are provided to make loading and messaging Components a simple task.

## A basic System

```ts
class ExampleSystems extends System {
  @inject('Pinger')
  Pinger: Pinger

  systemDidEnable() {
    const { Pinger } = this
    this.emitPing()
    await Pinger.getLastPing()
  }
}
```

Following the example started in the [Components ](../components/introduction.md), the System above emits a Ping message and request a value from an exposed method.

Systems can load Components using the `@inject` decorator by specifying the name registered in the Component System. Additional types for that Component must be created and exported separately.

## Receiving notifications

## Emitting messages

## Testing

## Security
