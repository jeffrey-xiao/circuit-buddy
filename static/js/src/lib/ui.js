var Constants = require("./constants.js");
var Main = require("./main.js");
var Api = require("./api.js");
var Vue = require("vue");
var fabric = require("fabric-webpack").fabric;
var $ = require("jquery");
var Tooltip = require("tether-tooltip");

var AddTab = require("../components/add-tab.vue");
var CostInfo = require("../components/cost-info.vue");
var Modal = require("../components/modal.vue");
var Tab = require("../components/tab.vue");
var TabsBar = require("../components/tabs-bar.vue");
var TruthButton = require("../components/truth-button.vue");
var TruthTableContent = require("../components/truth-table-content.vue");

Vue.component('add-tab', AddTab);
Vue.component('cost-info', CostInfo);
Vue.component('modal', Modal);
Vue.component('tab', Tab);
Vue.component('tabs-bar', TabsBar);
Vue.component('truth-button', TruthButton);
Vue.component('truth-table-content', TruthTableContent);

var globalTabCounter = 2;
var globalTabIdCounter = 1;

var positions = [
	'top-left',
	'left-top',
	'left-middle',
	'left-bottom',
	'bottom-left',
	'bottom-center',
	'bottom-right',
	'right-bottom',
	'right-middle',
	'right-top',
	'top-right',
	'top-center'
];

function destroyTooltip (el) {
	if (el._tooltip) {
		el._tooltip.destroy();
		delete el._tooltip;
	}
}
function createTooltip (el, content, position) {
	el._tooltip = new Tooltip({
		target: el,
		position: position,
		content: content,
		tetherOptions: {
	  		constraints: [{
	      		to: 'window',
	      		attachment: 'together',
	      		pin: true,
	    	}]
		}
	});
}

Vue.directive('tooltip', {
	bind: function (el, binding) {
		var position = "top-center";
		console.log(binding.modifiers);
		for (var key in positions)
			if (binding.modifiers[positions[key]])
				position = positions[key];
		position = position.replace("-", " ");
		createTooltip(el, binding.value, position);
	},
	unbind (el) {
		destroyToolTip(el);
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
			Main.Events.$on('tabs:add-tab', this.addTab);
			Main.Events.$on('tabs:set-active', function (event, tabId) {
				ref.activeTab = tabId;
				var index = ref.tabs.findIndex(tab => tab.id == tabId);
				Main.removeAllCanvasObjects();
				Main.objects = ref.objectsList[index];
				Main.addAllCanvasObjects();
				Main.updateOutputs();
			});
			Main.Events.$on('tabs:delete-tab', function (event, tabId) {
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
			Main.Events.$on('tabs:import-tabs', function (objectsListJson) {
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
			Main.Events.$on('simplify:clicked', function () {
				var index = ref.tabs.findIndex(tab => tab.id == ref.activeTab);
				ref.addTab()
				Api.getMinimize(ref.objectsList[index], function (objects) {
					Vue.set(ref.objectsList, ref.objectsList.length - 1, objects);
					Main.objects = objects;
					Main.addAllCanvasObjects();
					Main.updateOutputs();
				});
			});
			Main.Events.$on('tabs:import-photo', function (file) {
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