var $ = require("jquery");
var Main = require("./main.js");
var Api = require("./api.js");
var CanvasEvents = require("./canvas-events.js");
var Constants = require("./constants.js");
var Ui = require("./ui.js");

$(function () {
	$(this).keydown(CanvasEvents.onKeyDown);
	$(this).keyup(CanvasEvents.onKeyUp);

	$(document).ready(function () {
		Main.initApp();

		Main.canvas.on('mouse:over', CanvasEvents.onMouseOver);
		Main.canvas.on('mouse:up', CanvasEvents.onMouseUp);
		Main.canvas.on('object:moving', CanvasEvents.onObjectMoving);
		Main.canvas.on('mouse:move', CanvasEvents.onMouseMove);
		Main.canvas.on('mouse:down', CanvasEvents.onMouseDown);
	});
});