<template>
  <table :data-board="board">
    <tr>
      <td>{{ format(board[0]) }}</td>
      <td>{{ format(board[1]) }}</td>
      <td>{{ format(board[2]) }}</td>
    </tr>
    <tr>
      <td>{{ format(board[3]) }}</td>
      <td>{{ format(board[4]) }}</td>
      <td>{{ format(board[5]) }}</td>
    </tr>
    <tr>
      <td>{{ format(board[6]) }}</td>
      <td>{{ format(board[7]) }}</td>
      <td>{{ format(board[8]) }}</td>
    </tr>
  </table>
</template>

<script>
  export default {
    mixins: [],
    props: ["board"],
    data() {
      return {};
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
