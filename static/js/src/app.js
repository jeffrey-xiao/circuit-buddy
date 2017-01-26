function removeAllCanvasObjects (tab) {
	for (var key in Main.objects[tab])
		Main.canvas.remove(Main.objects[tab][key].element);
}

function addAllCanvasObjects (tab) {
	for (var key in Main.objects[tab])
		Main.canvas.add(Main.objects[tab][key].element);
	Main.generateTruthTable();
}

// removes all objects from the canvas and the map
function removeAllObjects (tab) {
	for (var key in Main.objects[tab]) {
		Main.canvas.remove(Main.objects[tab][key].element);
		delete Main.objects[tab][key];
	}
}

$(function () {
	window.onkeydown = function (e) {
		var key = e.keyCode ? e.keyCode : e.which;
		if (key == 8)
			isDeleting = true;
	}

	window.onkeyup = function (e) {
		var key = e.keyCode ? e.keyCode : e.which;
		if (key == 8)
			isDeleting = false;
	}

	$(document).ready(function () {
		Main.initApp();

		Main.canvas.on('mouse:over', CanvasEvents.onMouseOver);
		Main.canvas.on('mouse:up', CanvasEvents.onMouseUp);
		Main.canvas.on('object:moving', CanvasEvents.onObjectMoving);
		Main.canvas.on('mouse:move', CanvasEvents.onMouseMove);
		Main.canvas.on('mouse:down', CanvasEvents.onMouseDown);
		

		// adding a tab
		$("#add-tab").click(Ui.addTab);

		// removing the current tab
		$("body").on('click', "button[id^='delete-tab']", Ui.deleteTabOnClick);

		// switching tabs
		$("body").on('click', "div[id^='tab-']", Ui.tabOnClick);

		// click on simplify
		$("#simplify-button").click(Ui.simplifyButtonOnClick);

		// click on export
		$("#export-button").click(Ui.exportButtonOnClick);

		$("#export-exit-button").click(Ui.exportExitOnClick);

		$('#camera-button').click(Ui.cameraButtonOnClick);

		$("#camera-exit-button").click(Ui.cameraExitOnClick);

		$('#camera-import-button').click(Ui.cameraImportOnClick);

		// click on import
		$("#import-button").click(Ui.importButtonOnClick);

		$("#import-exit-button").click(Ui.importExitOnClick);

		$("#import-import-button").click(Ui.importImportOnClick);
	});
});