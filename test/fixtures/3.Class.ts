import { getPlugin } from '../../lib/client'
import { test } from './support/ClientHelpers'

test(async () => {

  const Runtime = getPlugin('Runtime')

  const Debugger = getPlugin('Debugger')

  const Profiler = getPlugin('Profiler')

  await Promise.all([
    Runtime.enable(),
    Debugger.enable(),
    Profiler.enable(),
    Runtime.run()
  ])

  const mutex = new Promise((resolve) => Profiler.onExecutionContextDestroyed(resolve))

  await Profiler.start()
  await mutex
  await Profiler.stop()
})
