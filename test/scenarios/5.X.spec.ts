import { future, wait } from './support/Helpers'
import * as assert from 'assert'
import { BasePlugin, ScriptingHost, registerPlugin } from '../../lib/host'
import { Test, setUpPlugins } from './support/Commons'
import './support/MessageBusManager'

@registerPlugin('TicTacToeBoard') export class TicTacToeBoard extends BasePlugin {
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

  @BasePlugin.expose async iAmConnected(...args: any[]) {
    this.waitForConnection.resolve(args)
  }
}

describe('TicTacToe', function () {
  this.timeout(6000)
  let numberOfGames = 0

  function randomizeGame(file: string) {
    it(`randomized game ${numberOfGames++} ${file}`, async function () {
      let workerO = await ScriptingHost.fromURL(file)
      let workerX = await ScriptingHost.fromURL(file)

      // workerX.getPluginInstance(MessageBusManager)
      // workerO.getPluginInstance(MessageBusManager)

      setUpPlugins(workerO)
      setUpPlugins(workerX)

      // workerX.setLogging({ logConsole: true })
      // workerO.setLogging({ logConsole: true });

      let apiX = workerX.getPluginInstance(TicTacToeBoard)
      let apiO = workerO.getPluginInstance(TicTacToeBoard)

      workerO.enable()
      workerX.enable()

      if (!apiX) throw new Error('Cannot get apiX instance')
      if (!apiO) throw new Error('Cannot get apiX instance')

      // awaits for web socket connections
      await apiX.waitForConnection
      await apiO.waitForConnection

      apiX.userDidChooseSymbol('x')
      apiO.userDidChooseSymbol('o')

      // clicks some positions
      for (let i = 0; i < 30; i++) {
        if (Math.random() > 0.5) {
          apiX.userDidClickPosition(i % 9)
        } else {
          apiO.userDidClickPosition(i % 9)
        }

        // Let the event system exchange the information between workers
        await wait(20)
      }

      // waits for result
      const TestPluginX = workerX.getPluginInstance(Test)
      const TestPluginO = workerO.getPluginInstance(Test)

      if (!TestPluginX) throw new Error('Cannot retieve Test plugin instance')
      if (!TestPluginO) throw new Error('Cannot retieve Test plugin instance')

      const winnerX = await TestPluginX.waitForPass()
      const winnerO = await TestPluginO.waitForPass()

      console.log('winner X', winnerX)
      console.log('winner O', winnerO)

      assert.deepEqual(winnerX, winnerO)

      // terminates the workers
      workerX.terminate()
      workerO.terminate()
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
