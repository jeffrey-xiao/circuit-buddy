<template>
	<div id="truth-table-content" v-html="html"></div>
</template>
<script>
	var Main = require("../lib/main.js");
	
	module.exports = {
		props: ["objects"],
		computed: {
			html: function () {
				this.$nextTick(function() {
	                 MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
	            });
				return Main.getLatex(this.objects);
			}
		}
	}
</script>