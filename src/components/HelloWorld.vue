<template>
	<div class="home">
    <input v-model="turnDelay"/>
    <input v-model="roundDelay"/>
		<div class="game playerBoard">
			<Playerboard :alpha="alpha" />
		</div>
		<div class="refresh" :key="turn">
			<div v-if="hiBoard" class="game hiBoard">
				<Board :board="hiBoard" />
			</div>
			<span
				id="id"
			>Generation{{generation}}; Turn #{{turn}}; Score {{score}}; HiScore: {{hiScore}}; maxTurns: {{maxTurns}}</span>
			<div id="clear" />
			<div v-for="game in games" :key="game.id" class="game">
				<Board :board="game.board" :class="classForGame(game)" />
			</div>
		</div>
	</div>
</template>

<script>
import _ from "lodash";
import { Neat, methods } from '@liquid-carrot/carrot';
/*import Neat from '../../node_modules/@liquid-carrot/carrot/src/neat'
import mutation from '../../node_modules/@liquid-carrot/carrot/src/methods/mutation'
*/
import Board from "./Board.vue";
import Playerboard from "./Playerboard.vue";
import Game from "../Game.js";

export default {
	mixins: [],
	props: [],
	components: {
		Board,
		Playerboard
	},
	data() {
		return {
			neatPOne: null,
			neatPTwo: null,
			games: [],
			networks: [],
			turn: 0,
			generation: 0,
			done: false,
			score: 0,
			hiScore: 0,
			hiBoard: null,
			alpha: null,
      maxTurns: 0,
      turnDelay: 10,
      roundDelay: 50
		};
	},
	methods: {
		classForGame(game) {
			return "status_" + game.status;
		},
		play() {
			this.games = [];
			this.turn = 0;
			for (let i = 0; i < 72; ) {
				const game = new Game(this.generation + ":" + i);
				const playerOne = this.neatPOne.population[i]
				const playerTwo = this.neatPTwo.population[i++];

				game.setPOne(playerOne);
				game.setPTwo(playerTwo);
				this.games.push(game);
			}
			const interval = window.setInterval(() => {
				let done = true;
				_.each(this.games, game => {
					if (!game.done) {
						game.turn();
					}
					done = done && game.done;
				});
				if (done) {
					window.clearInterval(interval);
					this.done = true;
					this.generation++;
				}
				this.turn++;
			}, this.turnDelay);
		}
	},
	computed: {},
	created() {
		const options = {
			population_size: 72,
			elitism: 3,
			mutation_rate: 0.9,
			mutation_amount: 3,
			maxNodes: 128,
			maxConnections: 10000,
      maxGates: 256,
      mutation: methods.mutation.FFW,
		};
		this.neatPOne = new Neat(9, 1, options);
		this.neatPTwo = new Neat(9, 1, options);
		this.play();
		const turn = () => {
			if (this.done) {
				let wait = this.roundDelay;
				_.each(this.games, game => {
					if (game.pOne.score > this.score) {
						this.score = game.pOne.score;
					}
					if (game.pTwo.score > this.score) {
						this.score = game.pTwo.score;
					}
					if (this.score > this.hiScore) {
						this.hiScore = this.score;
						this.hiBoard = game.board;
					}
					if (game.pTwo.score >= this.hiScore) {
						this.alpha = game.pTwo;
						window.alpha = this.alpha;
					}
					if (this.turn > this.maxTurns) {
						this.maxTurns = this.turn;
					}
					if (game.status == "draw") {
						wait = 30000;
					}
				});
				window.clearInterval(turnInterval);
				window.setTimeout(async () => {
          try {
					await this.neatPOne.evolve();
					await this.neatPTwo.evolve();
          } catch(error) {
            console.log('EVOLVE ERROR CAUGHT', error)
          }
					this.done = false;
					this.score = 0;
					this.play();

					turnInterval = window.setInterval(turn, this.roundDelay);
				}, wait);
			}
		};
		let turnInterval = window.setInterval(turn, 10);
	},
	mounted() {}
};
</script>

<style>
.game {
	width: 100%;
}
.game table {
	margin: 10px;
	float: left;
}
.game table td {
	width: 20px;
	height: 20px;
	text-align: center;
	line-height: 20px;
	color: white;
}
#id {
	font-size: 20px;
	font-weight: 300;
}

body {
	background: #333;
	color: white;
}
.game.hiBoard table {
	float: right;
	width: auto;
}
.game.hiBoard table td {
	width: 10px;
	height: 10px;
	line-height: 10px;
	font-size: 10px;
	border: 1px solid #555;
	color: #999;
}
.game.playerBoard table {
	float: right;
	width: auto;
}
.game.playerBoard table td {
	width: 10px;
	height: 10px;
	line-height: 10px;
	font-size: 10px;
	border: 1px solid white;
	color: white;
}

.status_going td {
	border: 1px solid #eee;
}
.status_loss td {
	border: 1px solid #555;
	color: #eee;
}
.status_win1 td {
	border: 1px solid #61df0d;
}
.status_win2 td {
	border: 1px solid #220ddf;
}
.status_draw td {
	border: 1px solid red;
}
#clear {
	clear: right;
}
</style>