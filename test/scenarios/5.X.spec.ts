import { testInWorker } from "./support/Helpers";
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

  userDidClickPosition(position: number) {
    this.notify('ClickPosition', position);
  }

  userDidChooseSymbol(symbol: 'x' | 'o') {
    this.notify('ChooseSymbol', symbol);
  }

  userDidRequestResults() {
    this.notify('RequestState');
  }

  getApi() {
    return {};
  }
}

ScriptingHost.registerPlugin('TicTacToeBoard', TicTacToeBoard);

const file = 'test/out/5.0.TicTacToe.js';

describe(file, () => {
  let workerX: ScriptingHost = null;
  let workerO: ScriptingHost = null;

  let apiX: TicTacToeBoard = null;
  let apiO: TicTacToeBoard = null;

  it('starts the workers', async () => {
    workerO = await ScriptingHost.fromURL(file);
    workerX = await ScriptingHost.fromURL(file);

    apiX = workerX.getPluginInstance(TicTacToeBoard);
    apiO = workerO.getPluginInstance(TicTacToeBoard);

    workerX.setLogging({ logConsole: true });
    workerO.setLogging({ logConsole: true });
  });

  it('sets the players', async () => {
    apiX.userDidChooseSymbol('x');
    apiO.userDidChooseSymbol('o');
  });

  it('clicks some positions', async () => {
    apiX.userDidClickPosition(0);
    apiO.userDidClickPosition(1);
    apiX.userDidClickPosition(3);
    apiO.userDidClickPosition(8);
    apiX.userDidClickPosition(6);

    apiX.userDidRequestResults();
    apiO.userDidRequestResults();
  });

  it('waits the result', async () => {



    const resultX = await (workerX.getPluginInstance(Test).waitForPass());
    const resultO = await (workerO.getPluginInstance(Test).waitForPass());

    console.log('X state', resultX);
    console.log('O state', resultO);
  });

  it('terminates the workers', async () => {
    workerX.terminate();
    workerO.terminate();
  });
});
