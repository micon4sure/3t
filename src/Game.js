function normalize(high, low, value) {
	return (value - low) / (high - low);
}
function denormalize(high, low, value) {
	return +low + value * (high - low);
}
const INCENTIVES = {
    illegal_move(player, otherPlayer) {
      //console.log('ILLEGAL MOVE', player.score)
      player.score -= 3;
    },
    win(player, otherPlayer) {
      //console.log('WIN', player.score)
      player.score += 3;
      otherPlayer.score -= 1;
    },
    win_prevent(player, otherPlayer) {
      //console.log('WIN PREVENT', player.score)
      player.score += 2;
      otherPlayer.score -= 1;
    },
    draw(player, otherPlayer) {
      //console.log('DRAW', player.score)
      player.score += 2;
      otherPlayer.score += 2;
    },
    turn_end(player, otherPlayer) {
      //console.log('TURN END', player.score, player.playerId)
      player.score += 1;
    }
}
export default class Game {
	constructor(id) {
		this.id = id;
		this.status = "going";
		this.done = false;
		this.turn = 0.5;
    this.board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	}

	setplayerOne(network) {
    network.score = 0;
		this.playerOne = network;
	}
	setplayerTwo(network) {
		network.score = 0;
		this.playerTwo = network;
  }
  getPlayerOne() {
    return this.playerOne;
  }
  getPlayerTwo() {
    return this.playerTwo;
  }
  
	playTurn() {
    const player = this.turn == 0.5 ? this.playerOne : this.playerTwo;
    const otherPlayer = this.turn == 1 ? this.playerOne : this.playerTwo;
    const move = Game.getMove(player, this.board);
		if (this.board[move] != 0) {
      INCENTIVES.illegal_move(player, otherPlayer)
			this.status = "illegal";
			//console.log("GAME", this.id, "LOST BY", this.next);
			this.done = true;
			return;
    }
    
    // check if this move prevents a win for the other player
    this.board[move] = this.turn == .5 ? 1 : .5;
    if(this.checkForWin()) {
      INCENTIVES.win_prevent(player, otherPlayer);
    }
    
		this.board[move] = this.turn;
    
		if (this.checkForDraw()) {
      INCENTIVES.draw(player, otherPlayer)
      this.status = "draw";
			this.done = true;
			return;
		}
    
		if (this.checkForWin()) {
      this.status = "win" + (this.turn == 0.5 ? 1 : 2);
      INCENTIVES.win(player, otherPlayer);
			this.done = true;
			return;
    }
    INCENTIVES.turn_end(player, otherPlayer)

		this.turn = this.turn == 0.5 ? 1 : 0.5;
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
  
  static getMove(player, board) {
    const moveRaw = player.activate(board);
    let move = 0;
    let max = 0;
    _.each(moveRaw, (value, cell) => {
      if(value > max) {
        move = cell;
        max = value
      }
    });
    return move;
  }

	checkForWin() {
		const allFieldsSame = (start, step) => {
			const firstField = this.board[start];
			if (firstField == 0) {
				return false;
			}
			if (
				this.board[start + step] == firstField &&
				this.board[start + step + step] == firstField
				//this.board[start + step + step + step] == firstField
			) {
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

		/*if (
			allFieldsSame(0, 1) ||
			allFieldsSame(4, 1) ||
			allFieldsSame(8, 1) ||
			allFieldsSame(12, 1)
		) {
			// horizontal win
			return true;
		}

		if (
			allFieldsSame(0, 4) ||
			allFieldsSame(1, 4) ||
			allFieldsSame(2, 4) ||
			allFieldsSame(3, 4)
		) {
			// vertical win
			return true;
		}

		if (allFieldsSame(0, 5) || allFieldsSame(2, 3)) {
			// diagnoal win
			return true;
		}*/
	}
}