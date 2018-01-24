import { getComponent } from '../../lib/client'
import { test } from './support/ClientHelpers'

test(async () => {
  const Terminator = await getComponent('Terminate')

  setInterval(() => Terminator.emitPing(), 16)

  while(true) {
  }
})
