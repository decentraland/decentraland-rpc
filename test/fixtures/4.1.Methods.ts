import * as assert from 'assert'
import { test, shouldFail } from './support/ClientHelpers'
import { MethodsPlugin } from './support/ClientCommons'

test(async () => {
  const Methods = await MethodsPlugin

  assert.equal(await Methods.enable(), 1)
  assert.equal(typeof (await Methods.getRandomNumber()), 'number')
  assert(await Methods.getRandomNumber() > 0)

  const sentObject = {
    x: await Methods.getRandomNumber()
  }

  assert.deepEqual(await Methods.receiveObject(sentObject), { received: sentObject })

  await Methods.failsWithoutParams(1)
  await Methods.failsWithParams()

  await shouldFail(() => Methods.failsWithoutParams(), 'failsWithoutParams')
  await shouldFail(() => Methods.failsWithParams(1), 'failsWithParams')

  const sentElements = [1, true, null, false, 'xxx', { a: null }]

  assert.deepEqual(await Methods.bounce(...sentElements), sentElements)
})
