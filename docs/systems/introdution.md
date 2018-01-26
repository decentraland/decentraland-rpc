# Introduction

Systems contain custom logic that is executed outside of the context of the [Component System](../components/component-system.md). They can run either locally using the Web Worker transport, or in another server through HTTP Requests/Web Sockets. Systems communicate with Components through JSON-RPC and several abstractions are provided to make loading and messaging Components a simple task.

## A basic System

```ts
class ExampleSystems extends System {
  @inject('SoundComponent')
  Sound: SoundComponent

  systemDidEnable() {
    const { Sound } = this
    await Sound.playSound('test.mp3');
  }
}
```

## Receiving notifications

## Emitting messages

## Testing

## Security
