import { future, TestableSystem, testSystem } from './support/ClientHelpers'
import { MessageBusClient } from './support/MessageBusClient'
import { inject } from '../../lib/client/index'

const winingCombinations = [
  [0, 1, 2], // 1 row
  [3, 4, 5], // 2 row
  [6, 7, 8], // 3 row

  [0, 3, 6], // 1 col
  [1, 4, 7], // 2 col
  [2, 5, 8], // 3 col

  [0, 4, 8], // nw - se
  [6, 4, 2] // sw - ne
]

type GameSymbol = 'x' | 'o' | null

class Game extends TestableSystem {
  @inject TicTacToeBoard: any = null

  mySymbol: GameSymbol = null

  board: GameSymbol[] = [null, null, null, null, null, null, null, null, null]

  getWinner() {
    return ['x', 'o'].find($ =>
      winingCombinations.some(combination =>
        combination.every(position => this.board[position] === $)
      )
    )
  }

  selectMySymbol(symbol: GameSymbol) {
    this.mySymbol = symbol
  }

  setAt(position: number, symbol: GameSymbol) {
    this.board[position] = symbol
  }

  async doTest() {
    const futureWinner = future()

    const messageBus = await MessageBusClient.acquireChannel(
      this,
      'rtc://tictactoe.signaling.com'
    )

    this.TicTacToeBoard.onChooseSymbol(({ symbol }: { symbol: GameSymbol }) => {
      this.selectMySymbol(symbol)
    })

    this.TicTacToeBoard.onClickPosition(
      ({ position }: { position: number }) => {
        messageBus.emit('set_at', position, this.mySymbol)
      }
    )

    messageBus.on('set_at', (index: number, symbol: GameSymbol) => {
      this.setAt(index, symbol)

      const winner = this.getWinner()

      if (winner !== undefined) {
        futureWinner.resolve(winner)
      }
    })

    await this.TicTacToeBoard.iAmConnected()

    await futureWinner
  }
}

testSystem(Game)
