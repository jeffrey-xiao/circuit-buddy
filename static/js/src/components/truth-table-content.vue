<template>
  <div id="truth-table-wrapper">
    <table id="truth-table-content">
      <thead><tr>
        <th v-for="i in tableObject.inputLength + tableObject.outputLength"
          v-bind:class="{'vertical-separator': i == tableObject.inputLength + 1}">
          {{i <= tableObject.inputLength ? String.fromCharCode(64 + i) : String.fromCharCode(87 + i - tableObject.inputLength)}}
        </th>
      </tr></thead>
      <tr v-for="(row, i) in tableObject.table">
        <td v-for="(cell, j) in row"
          v-bind:class="{'vertical-separator': j == tableObject.inputLength,
                   'horizontal-separator': i == 0}">
          {{cell}}
        </td>
      </tr>
    </table>
  </div>
</template>
<script>
  var Main = require("../lib/main.js");

  module.exports = {
    props: ["objects"],
    computed: {
      tableObject: function () {
        return Main.getTruthTable(this.objects);
      }
    }
  }
</script>
