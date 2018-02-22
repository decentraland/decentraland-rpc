import { System, Transports } from '../../lib/client'

const ScriptingClient = new System(Transports.WebWorker())

const x = async () => {
  const data: object = await ScriptingClient.call('MethodX', ['a worker generated string'])
  await ScriptingClient.call('JumpBack', data)
}
x().catch(x => console.error(x))
