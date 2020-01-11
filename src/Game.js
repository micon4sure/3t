import * as carrot from "@liquid-carrot/carrot"

const INCENTIVES = {
  win(player, otherPlayer) {
    player.score += 3;
    otherPlayer.score -= 3;
  },
  draw(player, otherPlayer) {
    player.score++;
    otherPlayer.score++;
  },
}
export default class Game {
  constructor(id) {
    this.id = id;
    this.status = "going";
    this.done = false;
    this.turn = 0.5;
    this.board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  }

  static getMove(player, board) {
    let move;
    if (!(player instanceof carrot.Neat)) {
      let moves = [];
      for (let i = 0; i < board.length; i++) {
        if (board[i] === 0) {
          moves.push(i);
        }
      }
      move = _.sample(moves);
    } else {
      const moveRaw = player.activate(board);
      let move = 0;
      let max = 0;
      _.each(moveRaw, (value, cell) => {
        if (value > max && board[cell] === 0) {
          move = cell;
          max = value
        }
      });
    }
    return move;
  }

  setplayerOne(network) {
    network.score = 0;
    this.playerOne = network;
  }

  getPlayerOne() {
    return this.playerOne;
  }

  playTurn() {
    const player = this.turn === 0.5 ? this.playerOne : {};
    const otherPlayer = this.turn === 1 ? this.playerOne : {};

    const move = Game.getMove(player, this.board);
    this.board[move] = this.turn;

    if (this.checkForWin()) {
      this.status = "win" + (this.turn === 0.5 ? 1 : 2);
      INCENTIVES.win(player, otherPlayer);
      this.done = true;
    } else if (this.checkForDraw()) {
      INCENTIVES.draw(player, otherPlayer);
      this.status = "draw";
      this.done = true;
    } else {
      this.turn = this.turn === 0.5 ? 1 : 0.5;
    }
  }

  checkForDraw() {
    let draw = true;
    _.each(this.board, value => {
      if (value === 0) {
        draw = false;
      }
    });
    return draw;
  }

  checkForWin() {
    const allFieldsSame = (start, step) => {
      const firstField = this.board[start];
      return firstField === 0
        ? false
        : this.board[start + step] === firstField && this.board[start + step + step] === firstField;
    };
    /*
    0 1 2
    3 4 5
    6 7 8
    */
    return allFieldsSame(0, 1) ||
    allFieldsSame(3, 1) ||
    allFieldsSame(6, 1)
      ? true
      : allFieldsSame(0, 3) ||
      allFieldsSame(1, 3) ||
      allFieldsSame(2, 3)
        ? true :
        allFieldsSame(0, 4) ||
        allFieldsSame(2, 2);
  }
}
