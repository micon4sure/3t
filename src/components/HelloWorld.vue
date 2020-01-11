<template>
    <div class="home">
        <input v-model="turnDelay"/>
        <input v-model="roundDelay"/>
        <input v-model="drawDelay"/>
        <div class="game playerBoard">
            <Playerboard :alpha="alphaTwo"/>
        </div>
        <div :key="turn" class="refresh">
            <div class="game hiBoard" v-if="hiBoard">
                <Board :board="hiBoard"/>
            </div>
            <h3
                    id="id"
            >Generation{{generation}}; Turn #{{turn}}; HiScore: ({{hiScoreOne}} / {{hiScoreTwo}}); maxTurns:
                {{maxTurns}}</h3>
            <h3>Win1: {{winOne}}; Win2: {{winTwo}}, Draw: {{draw}}</h3>
            <div id="clear"/>
            <div :key="game.id" class="game" v-for="game in games">
                <Board :board="game.board" :class="classForGame(game)"/>
            </div>
        </div>
        <div class="field">
            <div class="visualization" ref="visualization"></div>
        </div>
    </div>
</template>

<script>
  import _ from "lodash";
  import {methods} from "@liquid-carrot/carrot";
  import NeatSRC from "@liquid-carrot/carrot/src/neat";
  /*import Neat from '../../node_modules/@liquid-carrot/carrot/src/neat'
  import mutation from '../../node_modules/@liquid-carrot/carrot/src/methods/mutation'
  */
  import Board from "./Board.vue";
  import Playerboard from "./Playerboard.vue";
  import Game from "../Game.js";

  import vis from 'vis-network'

  const CONFIG = {
    games: 56,
    elitism: 5,
    wait_on_draw: 30000,
    roundDelay: 10,
    turnDelay: 10,
    drawDelay: 10
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
        neatPlayerOne: null,
        neatPlayerTwo: null,
        games: [],
        networks: [],
        turn: 0,
        generation: 0,
        done: false,
        hiScoreOne: 0,
        hiScoreTwo: 0,
        hiBoard: null,
        alphaOne: null,
        alphaTwo: null,
        maxTurns: 0,
        winOne: 0,
        winTwo: 0,
        draw: 0,
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
        for (let i = 0; i < CONFIG.games; i++) {
          const game = new Game(this.generation + ":" + i);
          const playerOne = this.neatPlayerOne.population[i];
          const playerTwo = this.neatPlayerTwo.population[i];

          playerOne.playerId = this.generation + ":" + i + "#1";
          playerTwo.playerId = this.generation + ":" + i + "#2";

          game.setplayerOne(playerOne);
          game.setplayerTwo(playerTwo);

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
              if (game.status === "win1") this.winOne++;
              else if (game.status === "win2") this.winTwo++;
              else if (game.status === "draw") this.draw++;
            });
            window.clearInterval(interval);
            this.done = true;
            this.generation++;
            this.graph();
          }
          this.turn++;
        }, this.turnDelay);
      },
      graph: async function () {
        if (!this.alphaOne) {
          return;
        }
        const network = this.alphaOne.toJSON();
        const element = this.$refs.visualization;
        const {nodes: neurons, connections} = network;
        console.log(network.nodes)

        // Make an array of objects representing each neuron's connections
        let neuron_map = neurons.map(() => ({incoming: [], outgoing: []}));

        // Store incoming and outgoing connetions
        for (let i = 0; i < connections.length; i++) {
          const current = connections[i];

          neuron_map[current.from].outgoing.push(current.to);
          neuron_map[current.to].incoming.push(current.from);
        }

        // Flattens neuron layers from `Network.toJSON` and converts it to 'vis-network'
        const nodes = new vis.DataSet(
          neurons.map(function (neuron, i) {
            neuron.type = !neuron_map[i].incoming.length // no incoming = input
              ? "input"
              : neuron_map[i].outgoing.length // incoming + outgoing = hidden
                ? "hidden"
                : "output"; // incoming, no outgoing = output


            let color;
            if (neuron.type == 'input') color = 'green';
            if (neuron.type == 'hidden') color = 'yellow';
            if (neuron.type == 'output') color = 'blue';

            return {
              id: neuron.index,
              title: neuron.index,
              label: neuron.index,
              color
            };
          })
        );

        // Flattens connections from `Network.toJSON` and converts it into 'vis-network'
        const edges = new vis.DataSet(
          connections.map(connection => ({
            from: connection.from,
            to: connection.to
          }))
        );

        // Vis.js Network Options
        // Will have a "left-to-right" graph with "smooth" lines representing
        // connections by default
        const options = {
          autoResize: true,
          height: "500px",
          width: "100%",
          edges: {
            smooth: {
              type: "cubicBezier",
              forceDirection: "horizontal"
            }
          },
          layout: {
            hierarchical: {
              direction: "UD",
              sortMethod: "directed"
            }
          },
          physics: false
        };

        const network_visualization = new vis.Network(
          element,
          {nodes, edges},
          options
        );
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
        maxNodes: 27,
        maxConnections: 100,
        maxGates: 0,
        /*mutation: [
            mutation.MOD_BIAS,
            mutation.MOD_WEIGHT,
            mutation.ADD_NODE,
            mutation.ADD_CONN
  ]*/
        mutation: mutation.FFW
      };
      this.neatPlayerOne = new NeatSRC(9, 9, options);
      this.neatPlayerTwo = new NeatSRC(9, 9, options);
      /**const template = architect.Perceptron(9, 6, 1);
       this.neatPlayerTwo = new NeatSRC({
			...options,
			template,
			mutation: [mutation.MOD_BIAS, mutation.MOD_WEIGHT]
		});*/
      this.play();
      const turn = () => {
        if (this.done) {
          let wait = this.roundDelay;
          _.each(this.games, game => {
            if (game.getPlayerOne().score >= this.hiScoreOne) {
              this.hiScoreOne = game.getPlayerOne().score;
              this.hiBoard = game.board;
              this.alphaOne = window.alphaOne = game.getPlayerOne();
            }
            if (game.getPlayerTwo().score >= this.hiScoreTwo) {
              this.hiScoreTwo = game.getPlayerTwo().score;
              this.alphaTwo = window.alphaTwo = game.getPlayerTwo();
            }
            if (this.turn > this.maxTurns) {
              this.maxTurns = this.turn;
            }
            if (game.status == "draw") {
              wait = this.drawDelay;
            }
          });

          let score = 0;
          _.each(this.games, game => {
            if (game.getPlayerOne().score > score) {
              this.alphaOne = window.alphaOne = game.getPlayerOne();
              score = game.getPlayerOne().score;
            }
          })

          window.clearInterval(turnInterval);
          window.setTimeout(async () => {
            await this.neatPlayerOne.evolve();
            await this.neatPlayerTwo.evolve();
            this.done = false;
            this.play();

            turnInterval = window.setInterval(turn, this.roundDelay);
          }, wait);
        }
      };
      let turnInterval = window.setInterval(turn, 10);
    },
    mounted() {
    }
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

    .status_illegal td {
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
