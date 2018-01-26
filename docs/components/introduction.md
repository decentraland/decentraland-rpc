# Introduction

Components work as a bridge between user-created scripts and the lower level APIs of the client (communication, 3D entity management, etc). It provides a set of exposed methods that can be accessed from the Web Worker context. These methods are `async` by default and Promises are used as hooks for events that may be triggered in the future (HTTP Responses, entity collisions, etc).

## A basic component

The following is the implementation of a basic Component that exposes the method `getLastPing` to be used by a external [System](../systems/introduction.md).


```ts
@registerComponent('Pinger')
export class Pinger extends Component {
  private lastPing: number = 0

  constructor(opt: ComponentOptions) {
    super(opt)
    opt.on('Ping', () => (this.lastPing = +new Date()))
  }

  @exposeMethod
  async getLastPing(): number {
    return this.lastPing
  }
}
```

A Component typically extends from the `Component` class exported by the SDK. This allows components to inherit the [options methods](#options-methods) which are used to communicate with other Systems. In the example above, a listener is registered for the `Ping` notification. Once a notification is emitted from a System the callback is executed as expected.

Components can expose methods that can be called from within a System using the `@exposeMethod` decorator. All exposed methods must be `async` but they are not required to return a Promise. This is not the case when calling the same method inside a System, where you [must always await the result](../systems/introduction.md). 

Components can hold state of their own, as is the case of the `lastPing` property in the example above. There are no hard limits on what you can do with state, but no update hooks are provided either.

Finally, the `@registerComponent` decorator will make the class available as a Component consumable from within other Systems.

## *Options* methods

When extending from the core `Component` class a set of functions become available through the `options` property. The following is a list of them and their functionality:

- `notify(identifier: string, data?: Array | Object)`
  
  Sends a notification message to the System. Other than exposed methods, this is the only method of communication between the two parts.

- `on(identifier: string, handler: (data?: Array | Object) => void)`

  Works as a listener for messages emitted from another System.

- `getComponentInstance(...)`

  Allows a component to create [create an instance of another component](#instancing-component) from within itself.

- `expose(identifier: string, handler: (...args) => Promise<any>)`

  Low level function that serves the same purpose as the `@exposeMethod` decorator does.


## Rate limiting
Rate limiting allows to specify a time interval in which calls to a Component's method can be accepted. This allows for more control over computationally expensive methods and can be specified by using the `@rateLimit(inteval)` decorator:

```ts
  @exposeMethod
  @rateLimit(1000)  
  asd
  async playSound(): number {
    // some sensible logic
  }
}
``` 

In the above example only one sound will be allowed to be played per second.

## Instancing a Component from within another Component

It is possible to access an istance of a Component from another Component's context. This can be achieved with the `getComponentInstance()` method found inside the `options` property.

It can be used to create an instance based on a Component's regitered name:

```ts
@registerComponent('ComponentOne')
class ComponentOne extends Component {

  @exposeMethod
  async someMethod() {
    return true
  }

}

@registerComponent('ComponentTwo')
class ComponentTwo extends Component {

  private One: ComponentOne

  constructor(options: ComponentOptions) {
    super(options)
    this.One = options.getComponentInstance('ComponentOne') as ComponentOne
  }

  otherMethod() {
    this.One.someMethod() // true
  }
  
}
```

A similar approach can be taken to access an instance based on the Component's constructor:

```ts
@registerComponent('ComponentOne')
class ComponentOne extends Component {

  @exposeMethod
  async someMethod() {
    return true
  }

}

@registerComponent('ComponentTwo')
class ComponentTwo extends Component {

  private One: ComponentOne

  constructor(options: ComponentOptions) {
    super(options)
    
    // We are not using a string any longer
    // Types are also correctly resolved
    this.One = options.getComponentInstance(ComponentOne)
  }

  otherMethod() {
    this.One.someMethod() // true
  }
  
}
```
