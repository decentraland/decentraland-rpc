import { inject, EventSubscriber } from '../../lib/client'
import { testSystem, TestableSystem, future } from "./support/ClientHelpers"

export class SomeSystem extends TestableSystem {
  @inject('eventController') eventController: any | null = null

  async doTest() {
    const eventSubscriber = new EventSubscriber(this.eventController)

    const didPass = future()

    eventSubscriber.onEvent('customEvent', (evt: any) => {
      didPass.resolve(evt)
    })

  }
}

testSystem(SomeSystem)
