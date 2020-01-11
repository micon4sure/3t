<template>
    <div v-if="alpha">

        <table :key="key">
            <tr>
                <td colspan="3">{{ alpha.playerId }}</td>
            </tr>
            <tr>
                <td @click="clickety(0)">{{ format(board[0]) }}</td>
                <td @click="clickety(1)">{{ format(board[1]) }}</td>
                <td @click="clickety(2)">{{ format(board[2]) }}</td>
            </tr>
            <tr>
                <td @click="clickety(3)">{{ format(board[3]) }}</td>
                <td @click="clickety(4)">{{ format(board[4]) }}</td>
                <td @click="clickety(5)">{{ format(board[5]) }}</td>
            </tr>
            <tr>
                <td @click="clickety(6)">{{ format(board[6]) }}</td>
                <td @click="clickety(7)">{{ format(board[7]) }}</td>
                <td @click="clickety(8)">{{ format(board[8]) }}</td>
            </tr>
            <tr>
                <td colspan="3">{{board}}</td>
            </tr>
        </table>
        <svg id="graph"/>
    </div>
</template>

<script>
  function normalize(high, low, value) {
    return (value - low) / (high - low);
  }

  function denormalize(high, low, value) {
    return +low + value * (high - low);
  }

  import Game from '../Game'

  export default {
    mixins: [],
    props: ["alpha"],
    data() {
      return {
        board: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        key: 0
      };
    },
    methods: {
      format(value) {
        switch (value) {
          case 0:
            return " ";
          case 0.5:
            return "X";
          case 1:
            return "O";
        }
      },
      clickety(num) {
        const reset = () => {
          window.setTimeout(() => {
            this.board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
          }, 1000);
        };
        this.board[num] = 0.5;
        console.log(this.board);
        this.key++;

        if (this.checkForWin()) {
          console.log("YOU WIN");
          reset();
          return;
        }

        const move = Game.getMove(this.alpha, this.board)
        if (this.board[move] != 0) {
          console.log("THE CARROT LOST, MOVE ON CELL", move, "IS ILLEGAL");
          reset();
        }

        this.board[move] = 1;

        if (this.checkForWin()) {
          console.log("THE CARROT WON");
          reset();
        }
      },
      checkForDraw() {
        let draw = true;
        _.each(this.board, value => {
          if (value === 0) {
            draw = false;
          }
        });
        return draw;
      },

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
      }
    },
    computed: {},
    created() {
    },
    mounted() {
    }
  };
</script>

<style>
</style>
