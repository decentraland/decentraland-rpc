import { getComponent } from '../../lib/client'
import { test } from './support/ClientHelpers'

test(async () => {

  const xRuntime = await getComponent('xRuntime')

  const xDebugger = await getComponent('xDebugger')

  const xProfiler = await getComponent('xProfiler')

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
