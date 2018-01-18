import { ScriptingClient, API } from '../../lib/client';
import assert = require('assert');
import { test, shouldFail, future, wait } from './support/ClientHelpers';
import { getWsMessageHub } from './support/MessageHub';

enum GameSymbol {
  X = 'x',
  O = 'o'
}

enum TicTacToeAction {
  PLACE = 'placeSymbol',
  RESTART = 'restart',
  SYNC = 'sync',
  SET_SYMBOL = 'setSymbol',
}

interface ITicTacToeState {
  board: GameSymbol[];
  mySymbol: GameSymbol;
}

interface IGenericAction {
  type: TicTacToeAction;
  payload?: any;
}

const initialState: ITicTacToeState = {
  board: [
    null, null, null,
    null, null, null,
    null, null, null
  ],
  mySymbol: null
};

let state = initialState;

function reducer(state: ITicTacToeState = initialState, action: IGenericAction): ITicTacToeState {
  const { type, payload } = action;

  switch (type) {
    case TicTacToeAction.SYNC:
      return {
        ...state,
        board: payload.board
      };

    case TicTacToeAction.RESTART:
      return {
        ...initialState
      };

    case TicTacToeAction.PLACE:
      return {
        ...state,
        board: Object.assign([], state.board, { [payload.index]: payload.symbol })
      };

    case TicTacToeAction.SET_SYMBOL:
      return {
        ...state,
        mySymbol: payload.symbol
      };
  }

  return state;
}

function handleAction(action: IGenericAction) {
  state = reducer(state, action);
}


test(async () => {
  const userFinishesCommands = future();
  const messageBus = getWsMessageHub('tictactoe');

  API.TicTacToeBoard.onCommandsDidFinish(async () => {
    API.Test.pass(state);
    userFinishesCommands.resolve(1);
  });

  API.TicTacToeBoard.onChooseSymbol((symbol: GameSymbol) => {
    handleAction({
      type: TicTacToeAction.SET_SYMBOL,
      payload: {
        symbol
      }
    });
  });

  API.TicTacToeBoard.onClickPosition((index: number) => {
    messageBus.emit('set_at', index, state.mySymbol);
  });

  messageBus.on('set_at', (index: number, symbol: GameSymbol) => {
    handleAction({
      type: TicTacToeAction.PLACE,
      payload: {
        index,
        symbol
      }
    });
  });

  await messageBus.waitForConnection();
  await API.TicTacToeBoard.iAmConnected();

  // give some time to the websockets to send messages
  await wait(300);

  // wait every command to execute
  await userFinishesCommands;
});
