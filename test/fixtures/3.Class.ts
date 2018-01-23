import { getComponent } from '../../lib/client'
import { test } from './support/ClientHelpers'

test(async () => {
  const Runtime = await getComponent('Runtime')
  const Debugger = await getComponent('Debugger')
  const Profiler = await getComponent('Profiler')

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
