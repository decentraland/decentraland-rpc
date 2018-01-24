import { testInWorker } from './support/Helpers'
import { Logger, Methods, Test } from './support/Commons'

describe('Class based systems', function() {
  testInWorker('test/out/7.0.MethodsInjection.js', {
    plugins: [Logger, Methods, Test],
    log: false
  })

  testInWorker('test/out/7.0.MethodsInjection.js?without_preload', {
    plugins: [],
    log: false
  })
})
