<template>
	<div class="modal" v-bind:id="name + '-modal'" v-show="isVisible">
	    <div class="modal-inner">
	        <h1 class="modal-title" v-html="title"></h1>
	        <input v-if="hasFileInput" class="modal-textarea" name="file" type="file" @change="onFileChange"></input>
	        <textarea v-if="hasTextArea" class="modal-textarea" v-model="textAreaContent"></textarea>
	        <button class="modal-button" v-on:click="exitAction">Exit</button>
	        <button class="modal-button" v-on:click="importAction" v-if="name == 'camera' || name == 'import'">Import</button>
	    </div>
	</div>
</template>

<script>
	var Main = require("../lib/main.js");

	var getJsonOutput = function (objectsList) {
		for (var i = 0; i < objectsList.length; i++) {
			for (var key in objectsList[i]) {
				var element = objectsList[i][key].element;
				objectsList[i][key].x1 = element.x1;
				objectsList[i][key].x2 = element.x2;
				objectsList[i][key].y1 = element.y1;
				objectsList[i][key].y2 = element.y2;
			}
		}
		return JSON.stringify(objectsList);
	};

	module.exports = {
		props: ["name", "title", "objectsList"],
		data: function () {
			return {
				isVisible: false,
				textAreaContent: null
			}
		},
		computed: {
			hasFileInput: function () {
				return this.name == "camera";
			},
			hasTextArea: function () {
				return this.name == "export" || this.name == "import";
			}
		},
		methods: {
			exitAction: function () {
				this.isVisible = false;
			},
			importAction: function () {
				this.isVisible = false;
				if (this.name == "import")
					Main.Events.$emit('tabs:import-tabs', this.textAreaContent);
				else if (this.name == "camera") {
					Main.Events.$emit('tabs:import-photo', this.textAreaContent);
				}
			},
			onFileChange: function (e) {
				var formData = new FormData();
				formData.append('file', e.target.files[0]);
				this.textAreaContent = formData;
			}
		},
		mounted: function () {
			var ref = this;
			Main.Events.$on(this.name+":clicked", function () {
				if (ref.name == "export")
					ref.textAreaContent = getJsonOutput(ref.objectsList);
				ref.isVisible = true;
			});
		}
	};
</script>