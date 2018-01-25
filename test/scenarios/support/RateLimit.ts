export function rateLimit<T>(interval: number = 100) {
  return function(
    target: T,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<() => Promise<any | void>>
  ) {
    const originalValue = descriptor.value as Function
    let lastCall: number = performance.now() 

    return {
      ...descriptor,
      value: function(this: T) {
        const now = performance.now()

        if ((now - lastCall) < interval) {
          return Promise.reject(new Error('Rate limit exceeded'))
        }
        
        lastCall = now
        
        return originalValue.apply(this, arguments)
      }
    }
  }
}
