<template>
	<div id="circuit-cost" v-html="html">		
	</div>
</template>

<script>
	var Main = require("../lib/main.js");

	module.exports = {
		props: ["objects"],
		computed: {
			html: function () {
				return "Cost: " + Main.getCost(this.objects);
			}
		}
	};
</script>