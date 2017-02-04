<template>
	<button class="truth-button" v-bind:id="name + '-button'" v-on:click="onClick">
	    <i v-bind:class="icon"></i>
	</button>
</template>

<script>
	var Main = require("../lib/main.js");

	module.exports = {
		props: ["name"],
		computed: {
			icon: function () {
				switch (this.name) {
					case "export":
						return "el el-download-alt";
					case "import":
						return "el el-eject";
					case "simplify":
						return "el el-cogs";
					case "camera":
						return "el el-camera";
					case "custom-object":
						return "el el-plus-sign";
				}
			}
		},
		methods: {
			onClick: function () {
				Main.Events.$emit(this.name + ":clicked");
			}
		}
	};
</script>