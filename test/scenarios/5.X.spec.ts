import { testInWorker, future, wait } from "./support/Helpers";
import assert = require('assert');
import { BasePlugin, ScriptingHost } from "../../lib/host";
import { Test } from "./support/Commons";

class TicTacToeBoard extends BasePlugin {
  /**
   * This API should mock the behavior of a board in the floor
   * inside a parcel. It will emit events that mimic click
   * interactions in a board.
   *
   * The class will triger those events via exposed methods that
   * are used in the test scenario
   */

  waitForConnection = future();

  userDidClickPosition(position: number) {
    this.options.notify('ClickPosition', { position });
  }

  userDidChooseSymbol(symbol: 'x' | 'o') {
    this.options.notify('ChooseSymbol', { symbol });
  }

  userDidRequestResults() {
    this.options.notify('CommandsDidFinish');
  }

  @BasePlugin.expose async iAmConnected(...args) {
    this.waitForConnection.resolve(args);
  }
}

ScriptingHost.registerPlugin('TicTacToeBoard', TicTacToeBoard);

const file = 'test/out/5.0.TicTacToe.js';

describe(file, function () {
  this.timeout(30000);
  let numberOfGames = 0;

  function randomizeGame() {
    let workerX: ScriptingHost = null;
    let workerO: ScriptingHost = null;

    let apiX: TicTacToeBoard = null;
    let apiO: TicTacToeBoard = null;

    it(`randomized game ${numberOfGames++}`, async function () {
      workerO = await ScriptingHost.fromURL(file);
      workerX = await ScriptingHost.fromURL(file);

      // workerX.setLogging({ logConsole: true });
      // workerO.setLogging({ logConsole: true });

      apiX = workerX.getPluginInstance(TicTacToeBoard);
      apiO = workerO.getPluginInstance(TicTacToeBoard);

      // awaits for web socket connections
      await apiX.waitForConnection;
      await apiO.waitForConnection;

      apiX.userDidChooseSymbol('x');
      apiO.userDidChooseSymbol('o');

      // clicks some positions
      for (let i = 0; i < 8; i++) {
        if (Math.random() > 0.5)
          apiX.userDidClickPosition(i);
        else
          apiO.userDidClickPosition(i);

        // Let the event system exchange the information between workers
        await wait(50);
      }

      // waits the result
      const winnerX = await (workerX.getPluginInstance(Test).waitForPass());
      const winnerO = await (workerO.getPluginInstance(Test).waitForPass());

      console.log('winner X', winnerX);
      console.log('winner O', winnerO);

      assert.deepEqual(winnerX, winnerO);

      // terminates the workers
      workerX.terminate();
      workerO.terminate();
    });
  }

  randomizeGame();
  randomizeGame();
  randomizeGame();
  randomizeGame();
});
