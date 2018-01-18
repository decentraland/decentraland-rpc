import { ScriptingClient, API } from '../../lib/client';
import assert = require('assert');
import { test, shouldFail } from './support/ClientHelpers';
import { WSMessageHub } from './support/MessageHub';

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
  type: TicTacToeAction,
  payload?: any;
}

const initialState: ITicTacToeState = {
  board:[
    null, null, null,
    null, null, null,
    null, null, null
  ],
  mySymbol: null
};

let state = initialState;

function reducer (state: ITicTacToeState = initialState, action: IGenericAction): ITicTacToeState {
  const { type, payload } = action;

  switch (type) {
    case TicTacToeAction.SYNC: {
      const { board } = payload as { board: GameSymbol[] };
      return { ...state, board };
    }
    
    case TicTacToeAction.RESTART: {
      return { ...initialState };
    }
    
    case TicTacToeAction.PLACE: {
      const { index } = payload as { index: number };
      return { ...state, board: Object.assign([], state.board, { [index]: state.mySymbol }) };
    }

    case TicTacToeAction.SET_SYMBOL: {
      const { symbol } = payload as { symbol: GameSymbol };
      return { ...state, mySymbol: symbol}
    }

    default: {
      return { ...state };
    }
  }
}

function handleAction(action: IGenericAction){
  state = reducer(state, action);
}


test(async () => {
  const messageBus = new WSMessageHub('tictactoe');

  API.TicTacToeBoard.onRequestState(() => API.Test.pass(state));

  API.TicTacToeBoard.onChooseSymbol((symbol: GameSymbol) => {
    handleAction({
      type: TicTacToeAction.SET_SYMBOL,
      payload: {
        symbol
      }
    });  
  });

  API.TicTacToeBoard.onClickPosition((index: number) => {
    handleAction({
      type: TicTacToeAction.PLACE,
      payload: {
        index
      }
    });
  });

  assert.equal(state.board, [
    'X', null, null,
    null, null, null,
    null, null, null
  ], 'Position 0 should have the X symbol')
});