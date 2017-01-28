function removeAllCanvasObjects () {
	for (var key in Main.objects)
		Main.canvas.remove(Main.objects[key].element);
}

function addAllCanvasObjects () {
	for (var key in Main.objects)
		Main.canvas.add(Main.objects[key].element);
	Main.generateTruthTable();
}

$(function () {
	window.onkeydown = CanvasEvents.onKeyDown;

	window.onkeyup = CanvasEvents.onKeyUp;

	$(document).ready(function () {
		Main.initApp();

		Main.canvas.on('mouse:over', CanvasEvents.onMouseOver);
		Main.canvas.on('mouse:up', CanvasEvents.onMouseUp);
		Main.canvas.on('object:moving', CanvasEvents.onObjectMoving);
		Main.canvas.on('mouse:move', CanvasEvents.onMouseMove);
		Main.canvas.on('mouse:down', CanvasEvents.onMouseDown);
	});
});