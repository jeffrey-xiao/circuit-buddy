var Main = (function (Constants) {

	var ret = {};
	ret.currObjectId = Constants.OPTS.initialObjectId;
	ret.currTab = 0;
	ret.canvas = null;
	ret.objects = {};

	ret.initApp = function () {
		// initialize the canvas
		ret.canvas = new fabric.Canvas('editor');
		ret.canvas.setWidth(Constants.OPTS.width);
		ret.canvas.setHeight(Constants.OPTS.height);
		ret.canvas.selection = false;
		ret.canvas.hoverCursor = 'default';
		ret.canvas.moveCursor = 'default';

		// initialize grid
		for (var i = 1; i < Constants.OPTS.width / Constants.OPTS.gridSize; i++) {
			ret.canvas.add(new fabric.Line([i * Constants.OPTS.gridSize, 0, i * Constants.OPTS.gridSize, Constants.OPTS.height], {
				stroke: '#373b41',
				selectable: false 
			}));
		}

		for (var i = 1; i < Constants.OPTS.height / Constants.OPTS.gridSize; i++) {
			ret.canvas.add(new fabric.Line([Constants.OPTS.gridSize, i * Constants.OPTS.gridSize, Constants.OPTS.width, i * Constants.OPTS.gridSize], {
				stroke: '#373b41',
				selectable: false
			}))
		}

		// initialize 'toolbox'
		for (var i = 0; i < Constants.GATES.length; i++) {
			var currGate = Constants.GATES[i];
			fabric.Image.fromURL(currGate.url, function (oImage) {
				ret.canvas.add(oImage);
			}, {
				id: currGate.id,
				selectable: false,
				isToolbox: true,
				top: i * Constants.OPTS.gridSize,
				height: Constants.OPTS.gridSize,
				width: Constants.OPTS.gridSize
			});
		}
	};

	ret.getGate = function (type) {
		return Constants.TYPE_NAMES[type];
	};

	ret.isGate = function (type) {
		return type <= 8;
	};

	ret.isEditableObject = function (id) {
		return id >= Constants.OPTS.initialObjectId
	};

	ret.updateCost = function () {
		var cost = 0;
		for (var key in ret.objects) {
			var element = ret.objects[key];
			if (element.type == Constants.TYPES.NOT_GATE) {
				if (element.inputs.length == 0 || ret.objects[element.inputs[0]].type != Constants.TYPES.OUTPUT_GATE)
					cost += 1;
			} else if (element.type != Constants.TYPES.INPUT_GATE && element.type != Constants.TYPES.OUTPUT_GATE && ret.isGate(element.type)) {
				cost += 1 + ret.objects[key].inputs.length;
			}
		}
		$('#circuit-cost').text("Cost: " + cost + ".");
	};


	ret.wireObjects = function (objId1, objId2, objects) {
		var obj1 = objects[objId1];
		var obj2 = objects[objId2];

		var x1 = obj1.left;
		var x2 = obj2.left + Constants.OPTS.gridSize;

		var y1 = obj1.top + Constants.OPTS.gridSize / 2;
		if (obj1.type != Constants.TYPES.OUTPUT_GATE)
			y1 = obj1.top + 10 + Math.min(30, obj1.inputs.length * 5);

		var y2 = obj2.top + Constants.OPTS.gridSize / 2;

		var hlineElement1 = new fabric.Line([x1, y1, (x1 + x2) / 2.0, y1], {
			stroke: '#81a2be',
			selectable: false,
			id: ret.currObjectId++,
			strokeWidth: 3
		});

		var vlineElement = new fabric.Line([(x1 + x2) / 2.0, y1, (x1 + x2) / 2.0, y2], {
			stroke: '#81a2be',
			selectable: true,
			hasControls: false,
			id: ret.currObjectId++,
			strokeWidth: 3
		});

		var hlineElement2 = new fabric.Line([x2, y2, (x1 + x2) / 2.0, y2], {
			stroke: '#81a2be',
			selectable: false,
			id: ret.currObjectId++,
			strokeWidth: 3
		});

		var hline1 = {
			element: hlineElement1,
			type: Constants.TYPES.HORIZONTAL_LINE,
			outputs: [],
			inputs: []
		};

		var hline2 = {
			element: hlineElement2,
			type: Constants.TYPES.HORIZONTAL_LINE,
			outputs: [],
			inputs: []
		};

		var vline = {
			element: vlineElement,
			type: Constants.TYPES.VERTICAL_LINE,
			y1: y1,
			y2: y2,
			outputs: [],
			inputs: []
		};

		hline1.outputs.push(objId1);
		hline1.inputs.push(vline.element.id);

		vline.outputs.push(hline1.element.id);
		vline.inputs.push(hline2.element.id);

		hline2.outputs.push(vline.element.id);
		hline2.inputs.push(objId2);

		objects[objId1].inputs.push(hline1.element.id);
		objects[objId2].outputs.push(hline2.element.id);

		// maybe not necessary
		Vue.set(objects, hline1.element.id, hline1);
		Vue.set(objects, hline2.element.id, hline2);
		Vue.set(objects, vline.element.id, vline);
	};

	ret.getOutput = function (currGate, inputMap, objects) {
		if (!currGate)
			return 0;
		if (currGate.type == Constants.TYPES.INPUT_GATE) {
			if (inputMap)
				return inputMap[currGate.element.id];
			return currGate.state == Constants.STATES.INPUT_ON;
		}
		if (currGate.inputs.length == 0)
			return 0;
		if (currGate.type == Constants.TYPES.HORIZONTAL_LINE || currGate.type == Constants.TYPES.VERTICAL_LINE) {
			var output = ret.getOutput(objects[currGate.inputs[0]], inputMap, objects);
			if (!inputMap)
				currGate.element.setStroke(output ? "#22A80C" : "#81a2be");
		} else if (currGate.type == Constants.TYPES.AND_GATE || currGate.type == Constants.TYPES.NAND_GATE) {
			var output = 1;
			for (var i = 0; i < currGate.inputs.length; i++)
				output &= ret.getOutput(objects[currGate.inputs[i]], inputMap, objects);
			if (currGate.type == Constants.TYPES.NAND_GATE) output = !output;
		} else if (currGate.type == Constants.TYPES.OR_GATE || currGate.type == Constants.TYPES.NOR_GATE) {
			var output = 0;
			for (var i = 0; i < currGate.inputs.length; i++)
				output |= ret.getOutput(objects[currGate.inputs[i]], inputMap, objects);
			if (currGate.type == Constants.TYPES.NOR_GATE) output = !output;
		} else if (currGate.type == Constants.TYPES.XOR_GATE || currGate.type == Constants.TYPES.NXOR_GATE) {
			var output = 0;
			for (var i = 0; i < currGate.inputs.length; i++)
				output ^= ret.getOutput(objects[currGate.inputs[i]], inputMap, objects);
			if (currGate.type == Constants.TYPES.NXOR_GATE) output = !output;
		} else if (currGate.type == Constants.TYPES.NOT_GATE) {
			var output = 0;
			if (currGate.inputs.length > 0)
				output = !ret.getOutput(objects[currGate.inputs[0]], inputMap, objects);
		}
		return output;
	};

	ret.updateOutputs = function () {
		for (var key in ret.objects) {
			var currGate = ret.objects[key];
			if (currGate.type == Constants.TYPES.OUTPUT_GATE) {
				var currState = Constants.STATES.OUTPUT_OFF;
				if (currGate.inputs.length > 0)
					currState = ret.getOutput(ret.objects[currGate.inputs[0]], null, ret.objects) == 1 ? Constants.STATES.OUTPUT_ON : Constants.STATES.OUTPUT_OFF;
				currGate.element.setSrc(currState, function () {
					ret.canvas.renderAll();
				});
			}
		}
	};

	ret.getTruthTable = function (objects) {
		if (objects === undefined)
			objects = ret.objects;

		var inputIds = [];
		var outputIds = [];

		for (var key in objects) {
			if (objects[key].type == Constants.TYPES.INPUT_GATE)
				inputIds.push(objects[key].element.id);
			else if (objects[key].type == Constants.TYPES.OUTPUT_GATE) {
				outputIds.push(objects[key].element.id);
			}
		}

		inputIds.sort();
		outputIds.sort();

		var inputMap = {};

		var truthTable = [];
		
		for (var i = 0; i < 1 << inputIds.length; i++) {
			truthTable.push(new Array(inputIds.length + outputIds.length));
			for (var j = 0; j < inputIds.length; j++) {
				inputMap[inputIds[j]] = (i & 1 << j) > 0 ? 1 : 0;
				truthTable[i][j] = (i & 1 << j) > 0 ? 1 : 0;
			}

			for (var j = 0; j < outputIds.length; j++) {
				if (objects[outputIds[j]].inputs.length == 0)
					truthTable[i][inputIds.length + j] = 0;
				else 
					truthTable[i][inputIds.length + j] = ret.getOutput(objects[objects[outputIds[j]].inputs[0]], inputMap, objects);
			}
		}

		return {
			table: truthTable,
			inputLength: inputIds.length,
			outputLength: outputIds.length
		};	
	};

	ret.getLatex = function (objects) {
		console.log(objects);
		console.log(ret);
		var tableObject = ret.getTruthTable(objects);
		var table = tableObject.table;
		var inputLength = tableObject.inputLength;
		if (table.length == 0) {
			$("#truth-table-content").text("\\begin{array}{}\\\\\\hline \\\\\\end{array}");
			return;
		}
		var rawLatex = "\\begin{array}{";
		for (var i = 0; i < table[0].length; i++)
			rawLatex += i == 0 ? "C" : "|C";
		rawLatex += "}"
		for (var i = 0; i < table[0].length; i++) {
			if (i != 0)
				rawLatex += "&";
			rawLatex += i < inputLength ? String.fromCharCode(65 + i) : String.fromCharCode(88 + i - inputLength);
		}
		rawLatex += "\\\\\\hline ";
		for (var i = 0; i < table.length; i++) {
			for (var j = 0; j < table[i].length; j++) {
				if (j != 0)
					rawLatex += "&";
				rawLatex += table[i][j] ? "T" : "F";
			}
			rawLatex += "\\\\";
		}
		rawLatex += "\\end{array}";
		//MathJax.Hub.Queue(["Typeset",MathJax.Hub,"truth-table"]);
		return rawLatex;
	};

	return ret;
}(Constants));