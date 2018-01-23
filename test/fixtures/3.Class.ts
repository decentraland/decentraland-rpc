import { getPlugin } from '../../lib/client'
import { test } from './support/ClientHelpers'

test(async () => {
  const Runtime = await getPlugin('Runtime')
  const Debugger = await getPlugin('Debugger')
  const Profiler = await getPlugin('Profiler')

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
