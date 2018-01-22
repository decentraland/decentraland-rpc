import { getPlugin } from '../../lib/client'
import { test } from './support/ClientHelpers'

test(async () => {

  const xRuntime = getPlugin('xRuntime')

  const xDebugger = getPlugin('xDebugger')

  const xProfiler = getPlugin('xProfiler')

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
