import { getPlugin } from '../../../lib/client'

export interface Methods {
  fail(): Promise<void>
  enable(): Promise<void>
  getRandomNumber(): Promise<number>
  receiveObject<T>(object: T): Promise<{ received: T }>
  failsWithoutParams(...args: any[]): Promise<any>
  failsWithParams(...args: any[]): Promise<any>
  fail(): Promise<void>
  setValue(key: string, value: any): Promise<void>
  getValue(key: string): Promise<any>
  bounce<T>(...args: T[]): Promise<T>
}

export interface Test {
  fail(err: Error): Promise<void>
  pass(result: any): Promise<void>
}

export const MethodsPlugin: Promise<Methods> = getPlugin('Methods')

export const TestPlugin: Promise<any> = getPlugin('Test')