import { future, wait } from './support/Helpers'
import * as assert from 'assert'
import { registerComponent, Component, ComponentSystem, exposeMethod } from '../../lib/host'
import { Test, setUpPlugins } from './support/Commons'
import './support/MessageBusManager'

@registerComponent('TicTacToeBoard')
export class TicTacToeBoard extends Component {
  /**
   * This API should mock the behavior of a board in the floor
   * inside a parcel. It will emit events that mimic click
   * interactions in a board.
   *
   * The class will triger those events via exposed methods that
   * are used in the test scenario
   */

  waitForConnection = future()

  userDidClickPosition(position: number) {
    this.options.notify('ClickPosition', { position })
  }

  userDidChooseSymbol(symbol: 'x' | 'o') {
    this.options.notify('ChooseSymbol', { symbol })
  }

  @exposeMethod
  async iAmConnected(...args: any[]) {
    this.waitForConnection.resolve(args)
  }
}

describe('TicTacToe', function () {
  this.timeout(6000)
  let numberOfGames = 0

  function randomizeGame(file: string) {
    it(`randomized game ${numberOfGames++} ${file}`, async function () {
      let workerO = await ComponentSystem.fromURL(file)
      let workerX = await ComponentSystem.fromURL(file)

      assert.equal(workerO.componentInstances.has('TicTacToeBoard'), false)

      setUpPlugins(workerO)
      setUpPlugins(workerX)

      workerO.enable()
      workerX.enable()

      // workerX.setLogging({ logConsole: true })
      // workerO.setLogging({ logConsole: true });

      let apiX = workerX.getComponentInstance(TicTacToeBoard)
      let apiO = workerO.getComponentInstance(TicTacToeBoard)

      assert.equal(workerO.componentInstances.has('TicTacToeBoard'), true)

      if (!apiX) throw new Error('Cannot get apiX instance')
      if (!apiO) throw new Error('Cannot get apiX instance')

      // await for web workers ready signal
      await apiX.waitForConnection
      await apiO.waitForConnection

      apiX.userDidChooseSymbol('x')
      apiO.userDidChooseSymbol('o')

      // click some positions
      for (let i = 0; i < 30; i++) {
        if (Math.random() > 0.5) {
          apiX.userDidClickPosition(i % 9)
        } else {
          apiO.userDidClickPosition(i % 9)
        }

        // Let the event system exchange the information between workers
        // this acts as a Thread.yield in C#
        await wait(0)
      }

      // waits for result
      const TestPluginX = workerX.getComponentInstance(Test)
      const TestPluginO = workerO.getComponentInstance(Test)

      if (!TestPluginX) throw new Error('Cannot retieve Test plugin instance')
      if (!TestPluginO) throw new Error('Cannot retieve Test plugin instance')

      const winnerX = await TestPluginX.waitForPass()
      const winnerO = await TestPluginO.waitForPass()

      assert.deepEqual(winnerX, winnerO)

      // terminates the workers
      workerX.unmount()
      workerO.unmount()
    })
  }

  randomizeGame('test/out/5.0.TicTacToe.Redux.js')
  randomizeGame('test/out/5.0.TicTacToe.Redux.js')
  randomizeGame('test/out/5.0.TicTacToe.Redux.js')
  randomizeGame('test/out/5.0.TicTacToe.Redux.js')

  randomizeGame('test/out/5.1.TicTacToe.Class.js')
  randomizeGame('test/out/5.1.TicTacToe.Class.js')
  randomizeGame('test/out/5.1.TicTacToe.Class.js')
  randomizeGame('test/out/5.1.TicTacToe.Class.js')
})
