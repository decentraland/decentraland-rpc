import { testInWorker } from './support/Helpers'
import { Logger, Methods, Test } from './support/Commons'
import * as assert from 'assert'
describe('Failure and exception transport', () => {
  testInWorker('test/out/4.0.Failures.js', {
    plugins: [Logger, Methods, Test],
    validateResult: result => {
      assert.deepEqual(result, { code: -32603, data: 'A message' })
    },
    log: true
  })

  testInWorker('test/out/4.1.Methods.js', {
    plugins: [Logger, Methods, Test],
    log: false
  })

  testInWorker('test/out/4.2.UnknownComponent.js', {
    plugins: [],
    log: false
  })

  testInWorker('test/out/4.3.Methods.JSON.js', {
    plugins: [Logger, Methods, Test],
    log: false,
    sendEncoding: 'JSON'
  })

  testInWorker('test/out/4.4.Failures.JSON.js', {
    plugins: [Logger, Methods, Test],
    log: true
  })
})
