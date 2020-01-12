import * as carrot from "@liquid-carrot/carrot"

const INCENTIVES = {
  win(player, otherPlayer) {
    if (player.nodes !== undefined) {
      player.score += 3;
    }
    if (otherPlayer.nodes !== undefined) {
      otherPlayer.score -= 3;
    }
  },
  draw(player, otherPlayer) {
    if (player.nodes !== undefined) {
      player.score++;
    }
    if (otherPlayer.nodes !== undefined) {
      otherPlayer.score++;
    }
  },
}
export default class Game {
  constructor(id) {
    this.id = id;
    this.status = "going";
    this.done = false;
    this.turn = 0.5;
    this.board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.playerOne = {};
    this.playerTwo = {};
  }

  static getMove(player, board) {
    let move;
    if (player instanceof carrot.Network) {
      const moveRaw = player.activate(board, {no_trace: true});
      let move = 0;
      let max = 0;
      _.each(moveRaw, (value, cell) => {
        if (value > max && board[cell] === 0) {
          move = cell;
          max = value
        }
      });
    } else {
      let moves = [];
      for (let i = 0; i < board.length; i++) {
        if (board[i] === 0) {
          moves.push(i);
        }
      }
      move = _.sample(moves);
    }
    return move;
  }

  setplayerOne(network) {
    if (network.nodes !== undefined) {
      network.score = 0;
    }
    this.playerOne = network;
  }

  setplayerTwo(network) {
    if (network.nodes !== undefined) {
      network.score = 0;
    }
    this.playerTwo = network;
  }

  playTurn() {
    const player = this.turn === 0.5 ? this.playerOne : this.playerTwo;
    const otherPlayer = this.turn === 0.5 ? this.playerTwo : this.playerOne;

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
      if (firstField === 0) {
        return false;
      } else if (this.board[start + step] === firstField && this.board[start + step + step] === firstField) {
        return true;
      }
    };
    /*
    0 1 2
    3 4 5
    6 7 8
    */
    if (allFieldsSame(0, 1) || allFieldsSame(3, 1) || allFieldsSame(6, 1)) {
      // horizontal win
      return true;
    }

    if (allFieldsSame(0, 3) || allFieldsSame(1, 3) || allFieldsSame(2, 3)) {
      // vertical win
      return true;
    }

    if (allFieldsSame(0, 4) || allFieldsSame(2, 2)) {
      // diagnoal win
      return true;
    }
  }
}
