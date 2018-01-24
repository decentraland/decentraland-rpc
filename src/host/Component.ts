// http://gameprogrammingpatterns.com/component.html

const exposedMethodSymbol = Symbol('exposedMethod')

export function exposeMethod<T extends Component>(
  target: T,
  propertyKey: keyof T,
  descriptor: TypedPropertyDescriptor<ExposableMethod>
) {
  getExposedMethods(target).add(propertyKey)
}

export function getExposedMethods<T extends Component>(
  instance: T
): Set<keyof T> {
  const instanceAny: any = instance
  instanceAny[exposedMethodSymbol] =
    instanceAny[exposedMethodSymbol] || new Set()
  return instanceAny[exposedMethodSymbol]
}

export type ComponentOptions = {
  componentName: string
  on(
    event: string,
    handler: <A, O extends object>(params: Array<A> | O) => void
  ): void
  notify(event: string, params?: any): void
  expose(
    event: string,
    handler: <A, O extends object>(params: Array<A> | O) => Promise<any>
  ): void
}

export type ComponentClass<T> = {
  new (options: ComponentOptions): T
}

export type ExposableMethod = (...args: any[]) => Promise<any>

/**
 * This pattern bears resemblance to the Gang of Four’s Strategy pattern.
 * Both patterns are about taking part of an object’s behavior and delegating
 * it to a separate subordinate object. The difference is that with the Strategy
 * pattern, the separate “strategy” object is usually stateless—it encapsulates
 * an algorithm, but no data. It defines how an object behaves, but not what it is.
 *
 * http://wiki.c2.com/?StrategyPattern
 *
 * Components are a bit more self-important. They often hold state that describes
 * the object and helps define its actual identity. However, the line may blur.
 * You may have some components that don’t need any local state. In that case,
 * you’re free to use the same component instance across multiple container objects.
 * At that point, it really is behaving more akin to a strategy.
 *
 * Components are located via service locators managed by the ComponentSystem
 *
 * A Components class defines an abstract interface to a set of operations.
 * That interface is exposed via @exposeMethod decorator. A concrete service
 * provider implements this interface. A separate service locator (ComponentSystem)
 * provides access to the service by finding an appropriate provider while hiding
 * both the provider’s concrete type and implementation and the process used to
 * locate it.
 */
export abstract class Component {
  static expose = exposeMethod

  constructor(protected options: ComponentOptions) {
    for (let methodName of getExposedMethods(this)) {
      const theMethod: any = this[methodName]
      if (typeof theMethod === 'function') {
        this.options.expose(methodName, theMethod.bind(this))
      }
    }
  }

  static factory(ctor: ComponentClass<Component>, options: ComponentOptions) {
    return new ctor(options)
  }
}

// we use an interface here because it is mergable with the class
export interface Component {
  componentDidMount?(): Promise<void> | void
  componentWillUnmount?(): Promise<void> | void
}
