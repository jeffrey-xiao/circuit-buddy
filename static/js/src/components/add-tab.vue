<template>
    <button id="add-tab" class="tab" v-on:click="addTab"><i class="el el-plus"></i></button>
</template>

<script>
  var Main = require("../lib/main.js");

  module.exports = {
    methods: {
      addTab: function (event) {
        Main.Events.$emit('tabs:add-tab');
      }
    }
  };
</script>
