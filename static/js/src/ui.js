var Ui = (function (Constants, Main, Api) {
	var globalTabCounter = 2;
	var ret = {};

	ret.addTab = function () {
		var len = $("div[id^='tab-']").length;
		$("#tabs .tab.active").removeClass("active");

		$("#tabs").append("<div id='tab-" + len + "' class='active tab'><span>Tab " + globalTabCounter + "</span><button id='delete-tab-" + len + "'><i class=\"el el-remove\"></i></button></div>");
		
		removeAllCanvasObjects(Main.currTab);
		Main.objects.push({});
		globalTabCounter++;
	};


	ret.deleteTabOnClick = function (e) {
		var id = parseInt($(this).attr('id').split("-")[2]);
		removeAllObjects(id);
		Main.objects.splice(id, 1);

		$(this).parent().remove();
		for (var i = id; i < Main.objects.length; i++)
			$('#tabs .tab').eq(i).attr('id', 'tab-'+i).find('button').attr('id', 'delete-tab-'+i);

		if (Main.objects.length == 0) {
			Main.objects.push({});
			$("#tabs").append("<div id='tab-0' class='active tab'><span>Tab "+globalTabCounter+"</span><button id='delete-tab-0'><i class=\"el el-remove\"></i></button></div>");		
			globalTabCounter++;
		}

		if (id == Main.objects.length)
			id--;
		
		$("div[id='tab-" + id + "']").addClass("active");

		Main.currTab = id;
		addAllCanvasObjects(Main.currTab);
	};

	ret.tabOnClick = function (e) {
		if ($(e.target).is('button')) return;
		if ($(e.target).is('i')) return;
		var id = parseInt($(this).attr('id').split("-")[1]);
		$("#tabs .tab.active").removeClass("active");
		$("div[id='tab-" + id + "']").addClass("active");
		removeAllCanvasObjects(Main.currTab);
		addAllCanvasObjects(id);
		Main.currTab = id;
		Main.generateTruthTable();
		Main.updateCost();
	};

	ret.simplifyButtonOnClick = function () {
		ret.addTab();
		Api.getMinimize(Main.objects.length - 1);
		Main.currTab = Main.objects.length - 1;
	};

	ret.exportButtonOnClick = function () {
		$("#export-modal").css("display", "block");
	};

	ret.exportExitOnClick = function () {
		$("#export-modal").css("display", "none");
	};

	ret.cameraButtonOnClick = function () {
		$("#camera-modal").css("display", "block");
	};

	ret.cameraExitOnClick = function () {
		$("#camera-modal").css("display", "none");
	};

	ret.cameraImportOnClick = function(e) {
		e.preventDefault();
		var formData = new FormData();
		formData.append('file', $('#camera-modal-textarea')[0].files[0]);
		
		ret.addTab();
		Api.importPhoto(formData, Main.objects.length - 1);
		Main.currTab = Main.objects.length - 1;

		$("#camera-modal").css("display", "none");
		var control = $('#camera-modal-textarea');
		control.replaceWith(control = control.clone(true));
	};

	ret.importButtonOnClick = function () {
		$("#import-modal").css("display", "block");
	};

	ret.importExitOnClick = function () {
		$("#import-modal").css("display", "none");
	};

	ret.importImportOnClick = function () {
		removeAllCanvasObjects(Main.currTab);
		delete Main.objects;
		Main.currTab = 0;
		Main.objects = JSON.parse($("#import-modal-textarea").val());
		for (var i = 0; i < Main.objects.length; i++) {
			for (var key in Main.objects[i]) {
				var tab = i;
				var element = Main.objects[tab][key].element;
				if (element.type == "image") {
					var src = Main.objects[tab][key].type == Constants.TYPES.INPUT_GATE ? Constants.STATES.INPUT_OFF : element.src;
					fabric.Image.fromURL(src, function (oImage) {
						Main.objects[oImage.tab][oImage.id].element = oImage;
						Main.objects[oImage.tab][oImage.id].state = Constants.STATES.INPUT_OFF;
						if (oImage.tab == Main.currTab) {
							Main.canvas.add(oImage);
						}
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
				} else if (Main.objects[tab][key].type == Constants.TYPES.HORIZONTAL_LINE) {
					Main.objects[tab][key].element = new fabric.Line([Main.objects[tab][key].x1, Main.objects[tab][key].y1, Main.objects[tab][key].x2, Main.objects[tab][key].y2], {
						stroke: '#81a2be',
						selectable: false,
						id: key,
						strokeWidth: 3
					});
					if (tab == Main.currTab)
						Main.canvas.add(Main.objects[tab][key].element);
				} else if (Main.objects[tab][key].type == Constants.TYPES.VERTICAL_LINE) {
					Main.objects[tab][key].element = new fabric.Line([Main.objects[tab][key].x1, Main.objects[tab][key].y1, Main.objects[tab][key].x2, Main.objects[tab][key].y2], {
						stroke: '#81a2be',
						selectable: true,
						hasControls: false,
						y1: Main.objects[tab][key].y1,
						y2: Main.objects[tab][key].y2,
						id: key,
						strokeWidth: 3
					});
					if (tab == Main.currTab)
						Main.canvas.add(Main.objects[tab][key].element);
				}
				Main.currObjectId = Math.max(Main.currObjectId, key + 1);
			}
		}
		$("div[id^='tab-']").remove();

		globalTabCounter = 1;
		
		for (var i = 0; i < Main.objects.length; i++) {
			if (i == 0)
				$("#tabs").append("<div id='tab-" + i + "' class='active tab'><span>Imported "+globalTabCounter+"</span><button id='delete-tab-" + i + "'><i class=\"el el-remove\"></i></button></div>");		
			else
				$("#tabs").append("<div id='tab-" + i + "' class='tab'><span>Imported "+globalTabCounter+"</span><button id='delete-tab-" + i + "'><i class=\"el el-remove\"></i></button></div>");		
			globalTabCounter++;
		}

		globalTabCounter = 1;
		
		$("#import-modal").css("display", "none");
		setTimeout(function () {
			Main.generateTruthTable();
			Main.updateOutputs();
			Main.updateCost();
		}, 500);
	};

	return ret;
}(Constants, Main, Api));