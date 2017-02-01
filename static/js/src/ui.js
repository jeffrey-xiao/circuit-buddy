var Constants = require("./constants.js");
var Main = require("./main.js");
var Api = require("./api.js");
var Vue = require("vue");
var fabric = require("fabric-webpack").fabric;
var $ = require("jquery");

var Events = new Vue({});

var globalTabCounter = 2;
var globalTabIdCounter = 1;

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

Vue.component('cost-info', {
	template: "<div id='circuit-cost' v-html='html'></div>",
	props: ["objects"],
	computed: {
		html: function () {
			return "Cost: " + Main.getCost(this.objects);
		}
	},

});

Vue.component('truth-table-content', {
	template: "<div id='truth-table-content' v-html='html'></div>",
	props: ["objects"],
	computed: {
		html: function () {
			this.$nextTick(function() {
                 MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
            });
			return Main.getLatex(this.objects);
		}
	}
});

Vue.component('truth-button', {
	template: "#truth-button-template",
	props: ["name"],
	computed: {
		icon: function () {
			switch(this.name) {
				case "export":
					return "el el-download-alt";
				case "import":
					return "el el-eject";
				case "simplify":
					return "el el-cogs";
				case "camera":
					return "el el-camera";
			}
		}
	},
	methods: {
		onClick: function () {
			Events.$emit(this.name + ":clicked");
		}
	}
});

Vue.component('modal', {
	template: "#modal-template",
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
				Events.$emit('tabs:import-tabs', this.textAreaContent);
			else if (this.name == "camera") {
				Events.$emit('tabs:import-photo', this.textAreaContent);
			}
		},
		onFileChange: function (e) {
			console.log(e.target.files);
			var formData = new FormData();
			formData.append('file', e.target.files[0]);
			this.textAreaContent = formData;
		}
	},
	mounted: function () {
		var ref = this;
		Events.$on(this.name+":clicked", function () {
			if (ref.name == "export")
				ref.textAreaContent = getJsonOutput(ref.objectsList);
			ref.isVisible = true;
		});
	}
});

Vue.component('tab', {
	template: "#tab-template",
	props: ['tabId', 'currActive', 'name'],
	data: function () {
		return {};
	},
	computed: {
		isActive: function () {
			return this.currActive == this.tabId;
		}
	},
	methods: {
		setActive: function (event) {
			Events.$emit('tabs:set-active', event, this.tabId);
		},
		deleteTab: function () {
			Events.$emit('tabs:delete-tab', event, this.tabId);
		}
	}
});

Vue.component('add-tab', {
	template: "#add-tab-template",
	methods: {
		addTab: function (event) {
			Events.$emit('tabs:add-tab');
		}
	}
});

Vue.component('tabs-bar', {
	template: "#tabs-bar-template",
	props: ['tabs', 'activeTab'],
	data: function () {
		return {};
	}
});

$(document).ready(function () {
	var app = new Vue({
		el: '#main',
		data: {
			tabs: [{
				name: "Tab 1",
				id: 0
			}],
			activeTab: 0,
			objectsList: [{}]
		},
		methods: {
			addTab: function () {
				this.tabs.push({
					name: "Tab " + globalTabCounter++,
					id: globalTabIdCounter++
				});
				this.objectsList.push({});

				this.activeTab = globalTabIdCounter - 1;
				Main.removeAllCanvasObjects();
				Main.objects = this.objectsList[this.tabs.length - 1];
			}
		},
		mounted: function () {
			Main.objects = this.objectsList[0];
			var ref = this;
			Events.$on('tabs:add-tab', this.addTab);
			Events.$on('tabs:set-active', function (event, tabId) {
				ref.activeTab = tabId;
				var index = ref.tabs.findIndex(tab => tab.id == tabId);
				Main.removeAllCanvasObjects();
				Main.objects = ref.objectsList[index];
				Main.addAllCanvasObjects();
				Main.updateOutputs();
			});
			Events.$on('tabs:delete-tab', function (event, tabId) {
				event.stopPropagation();
				var index = ref.tabs.findIndex(tab => tab.id == tabId);
				var deletedId = ref.tabs[index].id;
				ref.tabs.splice(index, 1);
				ref.objectsList.splice(index, 1);
				if (ref.tabs.length == 0) {
					ref.tabs.push({
						name: "Tab " + globalTabCounter++,
						id: globalTabIdCounter++
					});
					ref.objectsList.push({});
				}
				if (index == ref.tabs.length)
					index--;
				if (ref.activeTab == deletedId) {
					ref.activeTab = ref.tabs[index].id;
					Main.removeAllCanvasObjects();
					Main.objects = ref.objectsList[index];
				}
				Main.addAllCanvasObjects();
				Main.updateOutputs();
			});
			Events.$on('tabs:import-tabs', function (objectsListJson) {
				Main.removeAllCanvasObjects();
				ref.tabs = [];
				ref.objectsList = JSON.parse(objectsListJson);
				ref.activeTab = 0;
				globalTabCounter = 1;
				globalTabIdCounter = 0;

				for (var i = 0; i < ref.objectsList.length; i++) {
					for (var key in ref.objectsList[i]) {
						var tab = i;
						var element = ref.objectsList[tab][key].element;
						if (element.type == "image") {
							var src = ref.objectsList[tab][key].type == Constants.TYPES.INPUT_GATE ? Constants.STATES.INPUT_OFF : element.src;
							fabric.Image.fromURL(src, function (oImage) {
								ref.objectsList[oImage.tab][oImage.id].element = oImage;
								ref.objectsList[oImage.tab][oImage.id].state = Constants.STATES.INPUT_OFF;
							}, {
								id: key,
								tab: tab,
								top: element.top,
								left: element.left,
								height: element.height,
								width: element.width,
								hasBorders: false,
								hasControls: false,
								hasRotatingPoint: false
							});
						} else if (ref.objectsList[tab][key].type == Constants.TYPES.HORIZONTAL_LINE) {
							ref.objectsList[tab][key].element = new fabric.Line([ref.objectsList[tab][key].x1, ref.objectsList[tab][key].y1, ref.objectsList[tab][key].x2, ref.objectsList[tab][key].y2], {
								stroke: '#81a2be',
								selectable: false,
								id: key,
								strokeWidth: 3
							});
						} else if (ref.objectsList[tab][key].type == Constants.TYPES.VERTICAL_LINE) {
							ref.objectsList[tab][key].element = new fabric.Line([ref.objectsList[tab][key].x1, ref.objectsList[tab][key].y1, ref.objectsList[tab][key].x2, ref.objectsList[tab][key].y2], {
								stroke: '#81a2be',
								selectable: true,
								hasControls: false,
								y1: ref.objectsList[tab][key].y1,
								y2: ref.objectsList[tab][key].y2,
								id: key,
								strokeWidth: 3
							});
						}
						Main.currObjectId = Math.max(Main.currObjectId, key + 1);
					}
				}

				for (var i = 0; i < ref.objectsList.length; i++) {
					ref.tabs.push({
						name: "Imported " + globalTabCounter++,
						id: globalTabIdCounter++
					});
				}

				globalTabCounter = 1;
				Main.objects = ref.objectsList[0];

				setTimeout(function () {
					Main.addAllCanvasObjects();
					Main.updateOutputs();
					
				});
			});
			Events.$on('simplify:clicked', function () {
				var index = ref.tabs.findIndex(tab => tab.id == ref.activeTab);
				ref.addTab()
				Api.getMinimize(ref.objectsList[index], function (objects) {
					Vue.set(ref.objectsList, ref.objectsList.length - 1, objects);
					Main.objects = objects;
					Main.addAllCanvasObjects();
					Main.updateOutputs();
				});
			});
			Events.$on('tabs:import-photo', function (file) {
				ref.addTab();
				Api.importPhoto(file, function (objects) {
					Vue.set(ref.objectsList, ref.objectsList.length - 1, objects);
					Main.objects = objects;
					Main.addAllCanvasObjects();
					Main.updateOutputs();
				});
			});
		}
	});
});

module.exports = {};