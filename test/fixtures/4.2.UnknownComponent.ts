import { testToFail } from './support/ClientHelpers'

testToFail(async ScriptingClient => {
  await ScriptingClient.loadComponents([Math.random().toString()])
})
