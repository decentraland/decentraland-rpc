import { ScriptingClient, getPlugin } from '../../../lib/client';

export const Methods = getPlugin('Methods') as {
  fail(): Promise<void>;
  enable(): Promise<void>;
  getRandomNumber(): Promise<number>;
  receiveObject<T>(object: T): Promise<{ received: T }>;
  failsWithoutParams(...args): Promise<any>;
  failsWithParams(...args): Promise<any>;
  fail(): Promise<void>;

  setValue(key: string, value: any): Promise<void>;
  getValue(key: string): Promise<any>;

  bounce<T>(...args: T[]): Promise<T>;
};

export const Test = getPlugin('Test') as {
  fail(err: Error): Promise<void>;
  pass(result: any): Promise<void>;
};
