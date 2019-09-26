function normalize(high, low, value) {
	return (value - low) / (high - low);
}
function denormalize(high, low, value) {
	return +low + value * (high - low);
}
export default class Game {
	constructor(id) {
		this.id = id;
		this.status = "going";
		this.done = false;
		this.turnPlayer = 0.5;
		this.board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	}

	setPOne(network) {
		network.score = 0;
		this.pOne = network;
	}
	setPTwo(network) {
		network.score = 0;
		this.pTwo = network;
	}

	turn() {
		const player = this.turn == 0.5 ? this.pOne : this.pTwo;
		const moveRaw = player.activate(this.board);
    let moveDenormalized = denormalize(8, 0, moveRaw);
    if(moveDenormalized < 0)
    moveDenormalized = moveDenormalized * -1;
    const move = Math.round(moveDenormalized);

		if (this.board[move] != 0) {
			player.score -= 100;
			this.status = "loss";
			//console.log("GAME", this.id, "LOST BY", this.next);
			this.done = true;
			return;
    }
    
    // check if this move prevents a win for the other player
    this.board[move] = this.turnPlayer == .5 ? 1 : .5;
    if(this.checkForWin()) {
      player.score += 75;
    }

		this.board[move] = this.turnPlayer;

		if (this.checkForDraw()) {
			this.status = "draw";
			player.score += 1000;
			this.done = true;
			return;
		}

		if (this.checkForWin()) {
			this.status = "win" + (this.turnPlayer == 0.5 ? 1 : 2);
			player.score += 100;
			this.done = true;
			return;
		}
		player.score += 10;

		this.turnPlayer = this.turnPlayer == 0.5 ? 1 : 0.5;
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