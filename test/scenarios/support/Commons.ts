import { BasePlugin, ScriptingHost, exposeMethod } from '../../../lib/host'
import { future } from './Helpers'
import './MessageBusManager'

export class Logger extends BasePlugin {
  @exposeMethod
  async error(message: string) {
    console.error.call(console, message)
  }
  @exposeMethod
  async log(message: string) {
    console.log.call(console, message)
  }
  @exposeMethod
  async warn(message: string) {
    console.warn.call(console, message)
  }
  @exposeMethod
  async info(message: string) {
    console.info.call(console, message)
  }
}

ScriptingHost.registerPlugin('Logger', Logger)

export class Methods extends BasePlugin {
  store: { [key: string]: any } = {}

  @exposeMethod
  async setValue(key: string, value: any) {
    this.store[key] = value
  }

  @exposeMethod
  async getValue(key: string) {
    return this.store[key]
  }

  @exposeMethod
  async bounce(...args: any[]) {
    console.log('bounce received', arguments)
    return args
  }

  @exposeMethod
  async enable() {
    return 1
  }

  @exposeMethod
  async getRandomNumber() {
    return Math.random()
  }

  @exposeMethod
  async fail() {
    throw new Error('A message')
  }

  @exposeMethod
  async receiveObject(obj: any) {
    if (typeof obj !== 'object') {
      throw new Error('Did not receive an object')
    }
    return { received: obj }
  }

  @exposeMethod
  async failsWithoutParams() {
    if (arguments.length !== 1) {
      throw new Error(`Did not receive an argument. got: ${JSON.stringify(arguments)}`)
    }
    return { args: arguments }
  }

  @exposeMethod
  async failsWithParams() {
    if (arguments.length !== 0) {
      throw new Error(`Did receive arguments. got: ${JSON.stringify(arguments)}`)
    }
    return { args: arguments }
  }
}

ScriptingHost.registerPlugin('Methods', Methods)

export class Test extends BasePlugin {
  future = future<{ pass: boolean, arg: any }>()

  async waitForPass() {
    const result = await this.future

    if (!result.pass) {
      throw Object.assign(new Error('WebWorker test failed. The worker did not report error data.'), result.arg || {})
    }

    return result.arg
  }

  @exposeMethod
  async fail(arg: any) {
    this.future.resolve({ pass: false, arg })
  }

  @exposeMethod
  async pass(arg: any) {
    this.future.resolve({ pass: true, arg })
  }
}

ScriptingHost.registerPlugin('Test', Test)
