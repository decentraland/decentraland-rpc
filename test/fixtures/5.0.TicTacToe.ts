import { ScriptingClient, API } from '../../lib/client';
import assert = require('assert');
import { test, shouldFail } from './support/ClientHelpers';
import { WSMessageHub } from './support/MessageHub';

type GameSymbol = 'x' | 'o';

class TicTacToe extends WSMessageHub {
  board: GameSymbol[] = [
    null, null, null,
    null, null, null,
    null, null, null,
  ];

  mySymbol: GameSymbol = 'x';

  constructor(url: string) {
    super(url);

    this.on('placeSymbol', (symbol: GameSymbol, index: number) => {
      this.board[index] = symbol;
    });

    this.on('restart', () => {
      this.board = this.board.map(() => null);
    });

    this.on('sync', (newBoard: GameSymbol[]) => {
      this.board = newBoard;
    });

    this.on('otherUserDidJoin', () => {
      this.sendCurrentState();
    });

    // Notify that I joined
    this.emit('otherUserDidJoin');
  }

  sendCurrentState() {
    this.emit('sync', this.board);
  }

  placeSymbol(position: number) {
    this.emit('placeSymbol', this.mySymbol);
  }

  setSymbol(symbol: GameSymbol) {
    this.mySymbol = symbol;
  }

  getCurrentState() {
    return this.board;
  }

  reset() {
    this.board = [
      null, null, null,
      null, null, null,
      null, null, null
    ];
    this.sendCurrentState();
  }
}




test(async () => {
  const messageBus = new TicTacToe('tictactoe');



});
