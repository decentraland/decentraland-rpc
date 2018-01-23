import { Component, ComponentOptions, ExposableMethod } from './types'

// http://gameprogrammingpatterns.com/component.html

const exposedMethodSymbol = Symbol('exposedMethod')

export function exposeMethod(target: ComponentBase, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<ExposableMethod>) {
  getExposedMethods(target).add(propertyKey.toString())
}

export function getExposedMethods(instance: any): Set<string> {
  instance[exposedMethodSymbol] = instance[exposedMethodSymbol] || new Set()
  return instance[exposedMethodSymbol]
}

export abstract class ComponentBase implements Component {
  static expose = exposeMethod

  constructor(protected options: ComponentOptions) {
    const that = this as any as { [key: string]: Function }

    getExposedMethods(this).forEach(($: any) => {
      this.options.expose($, that[$].bind(this))
    })
  }

  terminate(): void { /* noop */ }
}
