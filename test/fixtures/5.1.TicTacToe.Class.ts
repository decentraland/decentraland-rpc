import { getPlugin } from '../../lib/client';
import { test, future } from './support/ClientHelpers';
import { MessageBusClient } from './support/MessageBusClient';
import { Test } from './support/ClientCommons';

const winingCombinations = [
  [0, 1, 2], // 1 row
  [3, 4, 5], // 2 row
  [6, 7, 8], // 3 row

  [0, 3, 6], // 1 col
  [1, 4, 7], // 2 col
  [2, 5, 8], // 3 col

  [0, 4, 8], // nw - se
  [6, 4, 2] // sw - ne
];

const TicTacToeBoard = getPlugin('TicTacToeBoard') as {
  onCommandsDidFinish(cb: () => void): void;
  onChooseSymbol(cb: (x: { symbol: GameSymbol }) => void): void;
  onClickPosition(cb: (x: { position: number }) => void): void;
  iAmConnected(): Promise<void>;
};

type GameSymbol = 'x' | 'o' | null;

class Game {
  mySymbol: GameSymbol = null;

  board: GameSymbol[] = [
    null, null, null,
    null, null, null,
    null, null, null
  ];

  getWinner() {
    return ['x', 'o'].find($ =>
      winingCombinations.some(combination =>
        combination.every(position => this.board[position] == $)
      )
    );
  }

  selectMySymbol(symbol: GameSymbol) {
    this.mySymbol = symbol;
  }

  setAt(position: number, symbol: GameSymbol) {
    this.board[position] = symbol;
  }
}

test(async () => {
  const futureWinner = future();

  const game = new Game();

  const messageBus = await MessageBusClient.acquireChannel('rtc://tictactoe2.signaling.com');

  TicTacToeBoard.onChooseSymbol(({ symbol }) => {
    game.selectMySymbol(symbol);
  });

  TicTacToeBoard.onClickPosition(({ position }) => {
    messageBus.emit('set_at', position, game.mySymbol);
  });

  messageBus.on('set_at', (index: number, symbol: GameSymbol) => {
    game.setAt(index, symbol);

    const winner = game.getWinner();

    if (winner != null) {
      Test.pass(winner);
      futureWinner.resolve(winner);
    }
  });

  await TicTacToeBoard.iAmConnected();

  // wait every command to execute
  console.log('class the winner is', await futureWinner);
});
