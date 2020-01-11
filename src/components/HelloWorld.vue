<template>
  <div class="home">
    <label>
      Time delay:
      <input v-model="delay"/>
    </label>
    <div class="game playerBoard">
      <Playerboard :alpha="alphaOne"/>
    </div>
    <div :key="turn" class="refresh">
      <h3 id="id">Generation: {{generation}}</h3>
      <h3>Win rate: {{100*(winOne+draw)/(winOne+winTwo+draw)}}%</h3>
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
  import Board from "./Board.vue";
  import Playerboard from "./Playerboard.vue";
  import Game from "../Game.js";

  import vis from 'vis-network'

  const CONFIG = {
    games: 104,
    elitism: 20,
    delay: 10,
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
        games: [],
        networks: [],
        turn: 0,
        generation: 0,
        done: false,
        alphaOne: null,
        maxTurns: 0,
        winOne: 0,
        winTwo: 0,
        draw: 0,
        delay: CONFIG.delay,
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
          playerOne.playerId = this.generation + ":" + i + "#1";
          game.setplayerOne(playerOne);

          this.games.push(game);
        }

        _.each(this.games, game => {
          while (!game.done) {
            game.playTurn();
          }
          if (game.status === "win1") {
            this.winOne++;
          } else if (game.status === "win2") {
            this.winTwo++;
          } else if (game.status === "draw") {
            this.draw++;
          }
          this.turn++;
        });
        this.done = true;
        this.generation++;
        this.graph();
      },
      graph: async function () {
        if (!this.alphaOne) {
          return;
        }
        const network = this.alphaOne.toJSON();
        const element = this.$refs.visualization;
        const {nodes: neurons, connections} = network;

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
          neurons.map(function (neuron) {
            let color;
            if (neuron.type === 'input') {
              color = 'green';
            }
            if (neuron.type === 'hidden') {
              color = 'yellow';
            }
            if (neuron.type === 'output') {
              color = 'red';
            }

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
              //type: "cubicBezier",
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

        new vis.Network(
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
        mutation_rate: 0.8,
        amount: 10,
        growth: 0,
        maxGates: 0,
        mutation: mutation.FFW
      };
      this.neatPlayerOne = new NeatSRC(9, 9, options);
      this.play();
      const turn = () => {
        if (this.done) {
          let score = -Infinity;
          _.each(this.games, game => {
            if (game.playerOne.score > score) {
              this.alphaOne = game.playerOne;
              score = game.playerOne.score;
            }
          });

          window.clearInterval(turnInterval);
          window.setTimeout(async () => {
            await this.neatPlayerOne.evolve();
            this.done = false;
            this.play();

            turnInterval = window.setInterval(turn, this.delay);
          }, this.delay);
        }
      };
      let turnInterval = window.setInterval(turn, this.delay);
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
    width: 30px;
    height: 30px;
    line-height: 30px;
    font-size: 30px;
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
