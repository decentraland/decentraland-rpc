import { WebWorkerTransport } from '../../../lib/client'

import { ITestInWorkerOptions } from './Helpers'

import { testWithTransport } from './TestWithTransport'

export function testInWorker(file: string, options: ITestInWorkerOptions = {}) {
  let worker: Worker | null = null
  it(`creates a worker for ${file}`, () => {
    worker = new Worker(file)
  })
  it(`tests the worker ${file}`, () => {
    return testWithTransport(file, options, WebWorkerTransport(worker!))
  })
}
