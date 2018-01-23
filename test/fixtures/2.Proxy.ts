import { getPlugin } from '../../lib/client'
import { test } from './support/ClientHelpers'

test(async () => {

  const xRuntime = await getPlugin('xRuntime')

  const xDebugger = await getPlugin('xDebugger')

  const xProfiler = await getPlugin('xProfiler')

  await Promise.all([
    xRuntime.enable(),
    xDebugger.enable(),
    xProfiler.enable(),
    xRuntime.run()
  ])

  await xProfiler.start()
  await new Promise((resolve) => xRuntime.onExecutionContextDestroyed(resolve))
  await xProfiler.stop()
})
