/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import { ScriptingHost } from '../../lib/host'
import * as assert from 'assert'
import { future } from './support/Helpers'
import { Test } from './support/Commons'

it('test/out/2.Proxy.js', async () => {
  const worker = await ScriptingHost.fromURL('test/out/2.Proxy.js')

  let aFuture = future()

  // worker.setLogging({ logConsole: true, logEmit: true });

  const enable = async () => void 0

  worker.expose('xDebugger.enable', enable)

  worker.expose('xProfiler.enable', enable)
  worker.expose('xProfiler.start', async () => {
    setTimeout(() => {
      worker.notify('xRuntime.ExecutionContextDestroyed')
    }, 16)
  })
  worker.expose('xProfiler.stop', async () => {
    aFuture.resolve(333)
    return { data: 'noice!' }
  })

  worker.expose('xRuntime.enable', enable)
  worker.expose('xRuntime.run', enable)

  assert.equal(await aFuture, 333, 'Did stop should have been called.')

  const TestPlugin = worker.getPluginInstance(Test)

  if (!TestPlugin) throw new Error('Cannot retieve Test plugin instance')

  await TestPlugin.waitForPass()

  worker.terminate()
})
