<template>
	<div class="home">
		<input v-model="turnDelay" />
		<input v-model="roundDelay" />
		<input v-model="drawDelay" />
		<div class="game playerBoard">
			<Playerboard :alpha="alphaTwo" />
		</div>
		<div class="refresh" :key="turn">
			<div v-if="hiBoard" class="game hiBoard">
				<Board :board="hiBoard" />
			</div>
			<h3
				id="id"
			>Generation{{generation}}; Turn #{{turn}}; Score {{score}}; HiScore: {{hiScore}}; maxTurns: {{maxTurns}}</h3>
      <h3>Win1: {{winOne}}, Win2: {{winTwo}}</h3>
			<div id="clear" />
			<div v-for="game in games" :key="game.id" class="game">
				<Board :board="game.board" :class="classForGame(game)" />
			</div>
		</div>
	</div>
</template>

<script>
import _ from "lodash";
import { Neat, methods, architect } from "@liquid-carrot/carrot";
import NeatSRC from "@liquid-carrot/carrot/src/neat";
/*import Neat from '../../node_modules/@liquid-carrot/carrot/src/neat'
import mutation from '../../node_modules/@liquid-carrot/carrot/src/methods/mutation'
*/
import Board from "./Board.vue";
import Playerboard from "./Playerboard.vue";
import Game from "../Game.js";

const CONFIG = {
	games: 55,
	elitism: 11,
	wait_on_draw: 30000,
	roundDelay: 50,
	turnDelay: 10,
	drawDelay: 500
};

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
			alphaOne: null,
			alphaTwo: null,
			maxTurns: 0,
			winOne: 0,
			winTwo: 0,
			turnDelay: CONFIG.turnDelay,
			roundDelay: CONFIG.roundDelay,
			drawDelay: CONFIG.drawDelay
		};
	},
	methods: {
		classForGame(game) {
			return "status_" + game.status;
		},
		play() {
			this.games = [];
			this.turn = 0;
			for (let i = 0; i < CONFIG.games; ) {
				const game = new Game(this.generation + ":" + i);
				let playerOne = this.neatPOne.population[i];
				let playerTwo = this.neatPTwo.population[i++];

				// in case of error during evolution, need to set new networks by hand, just use a perceptron.
				if (playerOne === undefined) {
					playerOne = architect.Perceptron(9, 9, 9, 9);
				}
				if (playerTwo === undefined) {
					playerTwo = architect.Perceptron(9, 9, 9, 9);
				}

				game.setPOne(playerOne);
				game.setPTwo(playerTwo);
				this.games.push(game);
			}
			const interval = window.setInterval(() => {
				let done = true;
				_.each(this.games, game => {
					if (!game.done) {
						game.playTurn();
					}
					done = done && game.done;
				});
				if (done) {
					_.each(this.games, game => {
						if (game.status == "win1") this.winOne++;
						if (game.status == "win2") this.winTwo++;
					});
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
		const mutation = methods.mutation;
		const options = {
			population_size: CONFIG.games,
			elitism: CONFIG.elitism,
			mutation_rate: 0.9,
			mutation_amount: 2,
			maxNodes: 14,
			maxConnections: 100,
			maxGates: 0,
			mutation: [
				mutation.MOD_BIAS,
				mutation.MOD_WEIGHT,
				mutation.ADD_NODE,
				mutation.ADD_CONN
			]
		};
		this.neatPOne = new Neat(9, 1, options);
		this.neatPTwo = new Neat(9, 1, options);
		/**const template = architect.Perceptron(9, 6, 1);
		this.neatPTwo = new NeatSRC({
			...options,
			template,
			mutation: [mutation.MOD_BIAS, mutation.MOD_WEIGHT]
		});*/
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
						this.alphaTwo = game.pTwo;
						window.alphaTwo = this.alphaTwo;
					}
					if (game.pOne.score >= this.hiScore) {
						this.alphaOne = game.pOne;
						window.alphaOne = this.alphaOne;
					}
					if (this.turn > this.maxTurns) {
						this.maxTurns = this.turn;
					}
					if (game.status == "draw") {
						wait = this.drawDelay;
					}
				});
				window.clearInterval(turnInterval);
				window.setTimeout(async () => {
					try {
						await this.neatPOne.evolve();
						await this.neatPTwo.evolve();
					} catch (error) {
						console.log("EVOLVE ERROR CAUGHT", error);
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