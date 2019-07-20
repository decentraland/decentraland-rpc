import { ScriptingHost } from '../../../lib/host'
import { ScriptingTransport } from '../../../lib/common/json-rpc/types'
import { Test } from './Commons'
import { ITestInWorkerOptions } from './Helpers'

export async function testWithTransport(
  file: string,
  options: ITestInWorkerOptions = {},
  transport: ScriptingTransport
) {
  const system = await ScriptingHost.fromTransport(transport)
  if (options.log) {
    system.setLogging({ logConsole: true })
  }
  options.plugins && options.plugins.forEach($ => system.getAPIInstance($))
  system.enable()
  options.execute && options.execute(system)
  const TestPlugin = system.getAPIInstance(Test)
  if (!TestPlugin) throw new Error('Cannot get the Test plugin instance')
  const result = await TestPlugin.waitForPass()
  options.validateResult && options.validateResult(result, system)
  system.unmount()
}
