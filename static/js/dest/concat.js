var Constants = (function () {
	var ret = {};
	
	ret.TYPES = {
		INPUT_GATE: 0,
		OUTPUT_GATE: 1,
		AND_GATE: 2,
		NAND_GATE: 3,
		OR_GATE: 4,
		NOR_GATE: 5,
		XOR_GATE: 6,
		NXOR_GATE: 7,
		NOT_GATE: 8,
		HORIZONTAL_LINE: 9,
		VERTICAL_LINE: 10
	};

	ret.TYPE_NAMES = ["Input Gate", "Output Gate", "And Gate", "Nand Gate", "Or Gate", 
				  	  "Nor Gate", "Xor Gate", "Nxor Gate", "Not Gate", "Horizontal Line", "Vertical Line"];

	ret.OPTS = {
		height: Math.round((window.innerHeight - 145) / 50.0) * 50,
		width: Math.round((window.outerWidth- 332) / 50.0) * 50,
		gridSize: 50,
		initialObjectId: 11
	};

	ret.STATES = {
		INPUT_ON: "img/input_gate_on.png",
		INPUT_OFF: "img/input_gate_off.png",
		OUTPUT_ON: "img/output_gate_on.png",
		OUTPUT_OFF: "img/output_gate_off.png"
	};

	ret.GATES = [
		{
			url: ret.STATES.INPUT_OFF,
			id: ret.TYPES.INPUT_GATE,
			type: ret.TYPES.INPUT_GATE
		},
		{
			url: ret.STATES.OUTPUT_OFF,
			id: ret.TYPES.OUTPUT_GATE,
			type: ret.TYPES.OUTPUT_GATE
		},
		{
			url: 'img/and_gate.png',
			id: ret.TYPES.AND_GATE,
			type: ret.TYPES.AND_GATE
		},
		{
			url: 'img/nand_gate.png',
			id: ret.TYPES.NAND_GATE,
			type: ret.TYPES.NAND_GATE
		},
		{
			url: 'img/or_gate.png',
			id: ret.TYPES.OR_GATE,
			type: ret.TYPES.OR_GATE
		},
		{
			url: 'img/nor_gate.png',
			id: ret.TYPES.NOR_GATE,
			type: ret.TYPES.NOR_GATE
		},
		{
			url: 'img/xor_gate.png',
			id: ret.TYPES.XOR_GATE,
			type: ret.TYPES.XOR_GATE
		},
		{
			url: 'img/nxor_gate.png',
			id: ret.TYPES.NXOR_GATE,
			type: ret.TYPES.NXOR_GATE
		},
		{
			url: 'img/not_gate.png',
			id: ret.TYPES.NOT_GATE,
			type: ret.TYPES.NOT_GATE
		}
	];

	return ret;
}());
var Main = (function (Constants) {
	// fills the truth table
	var injectLatex = function (table, inputs) {
		if (table.length == 0) {
			$("#truth-table-content").text("\\begin{array}{}\\\\\\hline \\\\\\end{array}");
			return;
		}
		var ret = "\\begin{array}{";
		for (var i = 0; i < table[0].length; i++)
			ret += i == 0 ? "C" : "|C";
		ret += "}"
		for (var i = 0; i < table[0].length; i++) {
			if (i != 0)
				ret += "&";
			ret += i < inputs ? String.fromCharCode(65 + i) : String.fromCharCode(88 + i - inputs);
		}
		ret += "\\\\\\hline ";
		for (var i = 0; i < table.length; i++) {
			for (var j = 0; j < table[i].length; j++) {
				if (j != 0)
					ret += "&";
				ret += table[i][j] ? "T" : "F";
			}
			ret += "\\\\";
		}
		ret += "\\end{array}";
		$("#truth-table-content").text(ret);
		MathJax.Hub.Queue(["Typeset",MathJax.Hub,"truth-table"]);
	}

	var ret = {};
	ret.currObjectId = Constants.OPTS.initialObjectId;
	ret.currTab = 0;
	ret.canvas = null;
	ret.objects = [{}];

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

	ret.updateJsonOutput = function () {
		for (var i = 0; i < ret.objects.length; i++) {
			for (var key in ret.objects[i]) {
				var element = ret.objects[i][key].element;
				ret.objects[i][key].x1 = element.x1;
				ret.objects[i][key].x2 = element.x2;
				ret.objects[i][key].y1 = element.y1;
				ret.objects[i][key].y2 = element.y2;
			}
		}
		$("#export-modal-textarea").val(JSON.stringify(ret.objects));
	};

	ret.isGate = function (type) {
		return type <= 8;
	};

	ret.isEditableObject = function (id) {
		return id >= Constants.OPTS.initialObjectId
	};

	ret.updateCost = function () {
		var cost = 0;
		for (var key in ret.objects[ret.currTab]) {
			var element = ret.objects[ret.currTab][key];
			if (element.type == Constants.TYPES.NOT_GATE) {
				if (element.inputs.length == 0 || ret.objects[ret.currTab][element.inputs[0]].type != Constants.TYPES.OUTPUT_GATE)
					cost += 1;
			} else if (element.type != Constants.TYPES.INPUT_GATE && element.type != Constants.TYPES.OUTPUT_GATE && ret.isGate(element.type)) {
				cost += 1 + ret.objects[ret.currTab][key].inputs.length;
			}
		}
		$('#circuit-cost').text("Cost: " + cost + ".");
	};


	ret.wireObjects = function (objId1, objId2, tab) {
		var obj1 = ret.objects[tab][objId1];
		var obj2 = ret.objects[tab][objId2];

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

		ret.objects[tab][objId1].inputs.push(hline1.element.id);
		ret.objects[tab][objId2].outputs.push(hline2.element.id);

		ret.objects[tab][hline1.element.id] = hline1;
		ret.objects[tab][hline2.element.id] = hline2;
		ret.objects[tab][vline.element.id] = vline;
	};

	ret.getOutput = function (currGate, inputMap) {
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
			var output = ret.getOutput(ret.objects[ret.currTab][currGate.inputs[0]], inputMap);
			if (!inputMap)
				currGate.element.setStroke(output ? "#22A80C" : "#81a2be");
		} else if (currGate.type == Constants.TYPES.AND_GATE || currGate.type == Constants.TYPES.NAND_GATE) {
			var output = 1;
			for (var i = 0; i < currGate.inputs.length; i++)
				output &= ret.getOutput(ret.objects[ret.currTab][currGate.inputs[i]], inputMap);
			if (currGate.type == Constants.TYPES.NAND_GATE) output = !output;
		} else if (currGate.type == Constants.TYPES.OR_GATE || currGate.type == Constants.TYPES.NOR_GATE) {
			var output = 0;
			for (var i = 0; i < currGate.inputs.length; i++)
				output |= ret.getOutput(ret.objects[ret.currTab][currGate.inputs[i]], inputMap);
			if (currGate.type == Constants.TYPES.NOR_GATE) output = !output;
		} else if (currGate.type == Constants.TYPES.XOR_GATE || currGate.type == Constants.TYPES.NXOR_GATE) {
			var output = 0;
			for (var i = 0; i < currGate.inputs.length; i++)
				output ^= ret.getOutput(ret.objects[ret.currTab][currGate.inputs[i]], inputMap);
			if (currGate.type == Constants.TYPES.NXOR_GATE) output = !output;
		} else if (currGate.type == Constants.TYPES.NOT_GATE) {
			var output = 0;
			if (currGate.inputs.length > 0)
				output = !ret.getOutput(ret.objects[ret.currTab][currGate.inputs[0]], inputMap);
		}
		return output;
	};

	ret.updateOutputs = function () {
		for (var key in ret.objects[ret.currTab]) {
			var currGate = ret.objects[ret.currTab][key];
			if (currGate.type == Constants.TYPES.OUTPUT_GATE) {
				var currState = Constants.STATES.OUTPUT_OFF;
				if (currGate.inputs.length > 0)
					currState = ret.getOutput(ret.objects[ret.currTab][currGate.inputs[0]], null) == 1 ? Constants.STATES.OUTPUT_ON : Constants.STATES.OUTPUT_OFF;
				currGate.element.setSrc(currState, function () {
					ret.canvas.renderAll();
				});
			}
		}
	};

	ret.generateTruthTable = function () {
		var inputIds = [];
		var outputNodes = [];

		for (var key in ret.objects[ret.currTab]) {
			if (ret.objects[ret.currTab][key].type == Constants.TYPES.INPUT_GATE)
				inputIds.push(ret.objects[ret.currTab][key].element.id);
			else if (ret.objects[ret.currTab][key].type == Constants.TYPES.OUTPUT_GATE) {
				outputNodes.push(ret.objects[ret.currTab][key].element.id);
			}
		}
		inputIds.sort();
		outputNodes.sort();

		var inputMap = {};

		var truthTable = [];
		
		for (var i = 0; i < 1 << inputIds.length; i++) {
			truthTable.push(new Array(inputIds.length + outputNodes.length));
			for (var j = 0; j < inputIds.length; j++) {
				inputMap[inputIds[j]] = (i & 1 << j) > 0 ? 1 : 0;
				truthTable[i][j] = (i & 1 << j) > 0 ? 1 : 0;
			}

			for (var j = 0; j < outputNodes.length; j++) {
				if (ret.objects[ret.currTab][outputNodes[j]].inputs.length == 0)
					truthTable[i][inputIds.length + j] = 0;
				else 
					truthTable[i][inputIds.length + j] = ret.getOutput(ret.objects[ret.currTab][ret.objects[ret.currTab][outputNodes[j]].inputs[0]], inputMap);
			}
		}
		
		injectLatex(truthTable, inputIds.length);
		return truthTable;	
	};

	return ret;
}(Constants));
var CanvasEvents = (function (Constants, Main) {
	var hline1, hline2, vline;
	var initialX, initialY;
	var mouseDownTime;
	var creatingLine = false;
	var isDeleting = false;
	var isDrawingFromInput = false, isDrawingFromOutput = false;
	var selectableIndicator = [];

	var propagateInputMovement = function (dx, dy, element, depth, prevX, prevY) {
		if (depth == 2 || !element)
			return;
		for (var i = 0; i < element.inputs.length; i++) {
			var input = Main.objects[Main.currTab][element.inputs[i]];
			var nextPrevX = input.element.x2;
			var nextPrevY = input.element.y2;
			if (input.type == Constants.TYPES.HORIZONTAL_LINE) {
				if (Math.abs(input.element.x2 - prevX) < 1e-6) {
					input.element.set({
						y1: input.element.y1 + dy,
						y2: input.element.y2 + dy,
						x2: input.element.x2 + dx
					});
					input.element.setCoords();
				} else {
					input.element.set({
						y1: input.element.y1 + dy,
						y2: input.element.y2 + dy,
						x1: input.element.x1 + dx
					});
					input.element.setCoords();
				}
			}
			else if (input.type == Constants.TYPES.VERTICAL_LINE) {
				if (Math.abs(input.element.y2 - prevY) < 1e-6) {
					input.element.set({
						y2: input.element.y2 + dy
					});
					input.element.setCoords();
				} else {
					input.element.set({
						y1: input.element.y1 + dy
					});
					input.y1 = input.element.y1;
					input.y2 = input.element.y2;
					input.element.setCoords();
				}
			}
			propagateInputMovement(dx, dy, input, depth + 1, nextPrevX, nextPrevY);
		}
	}

	var propagateOutputMovement = function (dx, dy, element, depth, prevX, prevY) {
		if (depth == 2 || !element)
			return;
		for (var i = 0; i < element.outputs.length; i++) {
			var output = Main.objects[Main.currTab][element.outputs[i]];
			var nextPrevX = output.element.x2;
			var nextPrevY = output.element.y2;
			if (output.type == Constants.TYPES.HORIZONTAL_LINE) {
				if (Math.abs(output.element.x2 - prevX) < 1e-6) {
					output.element.set({
						y1: output.element.y1 + dy,
						y2: output.element.y2 + dy,
						x2: output.element.x2 + dx
					});
					output.element.setCoords();
				} else {
					output.element.set({
						y1: output.element.y1 + dy,
						y2: output.element.y2 + dy,
						x1: output.element.x1 + dx
					});
					output.element.setCoords();
				}
			} else if (output.type == Constants.TYPES.VERTICAL_LINE) {
				if (Math.abs(output.element.y2 - prevY) < 1e-6) {
					output.element.set({
						y2: output.element.y2 + dy
					});
					output.element.setCoords();
				} else {
					output.element.set({
						y1: output.element.y1 + dy
					});
					output.y1 = output.element.y1;
					output.y2 = output.element.y2;
					output.element.setCoords();
				}
			}
			propagateOutputMovement(dx, dy, output, depth + 1, nextPrevX, nextPrevY);
		}
	}

	var getInputId = function (id) {
		var ids = [];
		
		for (var key in Main.objects[Main.currTab])
			if (Main.objects[Main.currTab][key].type == Constants.TYPES.INPUT_GATE)
				ids.push(Main.objects[Main.currTab][key].element.id);

		ids.sort();

		for (var i = 0; i < ids.length; i++)
			if (ids[i] == id) 
				return String.fromCharCode(65 + i);
	};

	var getOutputId = function (id) {
		var ids = [];
		
		for (var key in Main.objects[Main.currTab])
			if (Main.objects[Main.currTab][key].type == Constants.TYPES.OUTPUT_GATE)
				ids.push(Main.objects[Main.currTab][key].element.id);

		ids.sort();

		for (var i = 0; i < ids.length; i++)
			if (ids[i] == id) 
				return String.fromCharCode(88 + i);
	};

	var removeObject = function (element, depth) {
		if (depth == 4 || !element || !element.element)
			return;

		for (var i = 0; i < element.inputs.length; i++) {
			var nextInputElement = Main.objects[Main.currTab][element.inputs[i]];
			var index = nextInputElement.outputs.indexOf(element.element.id);
			nextInputElement.outputs.splice(index);
			removeObject(nextInputElement, depth + 1);
		}

		for (var i = 0; i < element.outputs.length; i++) {
			var nextOutputElement = Main.objects[Main.currTab][element.outputs[i]];
			var index = nextOutputElement.inputs.indexOf(element.element.id);
			nextOutputElement.inputs.splice(index);
			removeObject(nextOutputElement, depth + 1);
		}

		Main.canvas.remove(element.element);
		delete Main.objects[Main.currTab][element.element.id];
	};

	return {
		// displaying the name of the component when hovering over
		onMouseOver: function (options) {
			if (options.target && Main.isEditableObject(options.target.id)) {
				var id = options.target.id;
				if (isDeleting) {
					removeObject(Main.objects[Main.currTab][id], 0);
					Main.updateJsonOutput();
					Main.updateCost();
				} else if (Main.objects[Main.currTab][id]) {
					if (Main.objects[Main.currTab][id].type == Constants.TYPES.INPUT_GATE)
						$('#current-hovered-element').text("Hovered: Input Gate: " + getInputId(id) + ".");
					else if (Main.objects[Main.currTab][id].type == Constants.TYPES.OUTPUT_GATE)
						$('#current-hovered-element').text("Hovered: Output Gate: " + getOutputId(id) + ".");
					else
						$('#current-hovered-element').text("Hovered: " + Main.getGate(Main.objects[Main.currTab][id].type) + ".");
				}
			} else {
				$('#current-hovered-element').text("Hovered: No element.");
			}
		},

		onMouseUp: function (options) {
			// handling clicks
			if (new Date().getTime() - mouseDownTime < 100) {
				// creating new editable gate
				if (options.target && options.target.isToolbox) {
					var currGate = Constants.GATES[options.target.id];
					fabric.Image.fromURL(currGate.url, function (oImage) {
						Main.canvas.add(oImage);
						Main.objects[Main.currTab][oImage.id] = {
							element: oImage,
							type: currGate.type,
							outputs: [],
							inputs: [],
							top: currGate.id * Constants.OPTS.gridSize,
							left: Constants.OPTS.gridSize,
							width: Constants.OPTS.gridSize,
							height: Constants.OPTS.gridSize,
							state: Constants.STATES.INPUT_OFF
						};
						Main.generateTruthTable();
						Main.updateJsonOutput();
						Main.updateCost();
					}, {
						id: Main.currObjectId++,
						top: currGate.id * Constants.OPTS.gridSize,
						left: Constants.OPTS.gridSize,
						height: Constants.OPTS.gridSize,
						width: Constants.OPTS.gridSize,
						hasBorders: false,
						hasControls: false,
						hasRotatingPoint: false
					});
				} 
				// changing input
				else if (options.target && Main.objects[Main.currTab][options.target.id] && 
						 Main.objects[Main.currTab][options.target.id].type == Constants.TYPES.INPUT_GATE) {

					var currGate = Main.objects[Main.currTab][options.target.id];	
					currGate.state = currGate.state == Constants.STATES.INPUT_ON ? Constants.STATES.INPUT_OFF : 
																				   Constants.STATES.INPUT_ON;

					currGate.element.setSrc(currGate.state, function () {
						Main.canvas.renderAll();
					});
					Main.updateOutputs();
					Main.updateJsonOutput();
					Main.updateCost();
				}
			}
			
			// finishing wire connection
			if (hline1 && hline2 && vline && creatingLine) {
				var x = hline2.element.x2;
				var y = hline2.element.y2;
				var connected = false;
				Main.objects[Main.currTab][hline1.element.id] = hline1;
				Main.objects[Main.currTab][hline2.element.id] = hline2;
				Main.objects[Main.currTab][vline.element.id] = vline;

				for (var key in Main.objects[Main.currTab]) {
					var currGate = Main.objects[Main.currTab][key];
					if (Main.isGate(currGate.type) && currGate.element.left - 10 <= x && x <= currGate.element.left + 10 &&
						currGate.element.top <= y && y <= currGate.element.top + 50) {
						if (currGate.type == Constants.TYPES.INPUT_GATE)
							continue;
						if (isDrawingFromOutput)
							continue;
						hline2.outputs.push(currGate.element.id);
						currGate.inputs.push(hline2.element.id);

						hline2.element.set({
							x2: currGate.element.left
						});
						hline2.element.setCoords();

						connected = true;

						Main.updateOutputs();
						Main.canvas.renderAll();
						Main.updateJsonOutput();
						Main.updateCost();
					}
					if (Main.isGate(currGate.type) && currGate.element.left + 40 <= x && x <= currGate.element.left + 60 &&
						currGate.element.top + 20 <= y && y <= currGate.element.top + 30) {
						if (currGate.type == Constants.TYPES.OUTPUT_GATE)
							continue;
						if (isDrawingFromInput)
							continue;
						hline2.inputs.push(currGate.element.id);
						if (hline2.outputs.length == 1) {
							if (Math.abs(Main.objects[Main.currTab][hline2.outputs[0]].element.y1 - hline2.element.y2) < 1e-6) {
								Main.objects[Main.currTab][hline2.outputs[0]].element.set({
									y1: currGate.element.top + 25
								});
								Main.objects[Main.currTab][hline2.outputs[0]].element.setCoords();
							}
							if (Math.abs(Main.objects[Main.currTab][hline2.outputs[0]].element.y2 - hline2.element.y2) < 1e-6) {
								Main.objects[Main.currTab][hline2.outputs[0]].element.set({
									y2: currGate.element.top + 25
								});
								Main.objects[Main.currTab][hline2.outputs[0]].element.setCoords();
							}
						}
						currGate.outputs.push(hline2.element.id);

						hline2.element.set({
							x2: currGate.element.left + 50,
							y1: currGate.element.top + 25,
							y2: currGate.element.top + 25
						});
						hline2.element.setCoords();

						connected = true;
						
						updateOutputs();
						Main.canvas.renderAll();
						Main.updateJsonOutput();
						Main.updateCost();
					}
				}

				Main.updateJsonOutput();
				Main.updateCost();
				if (!connected) {
					for (var i = 0; i < hline1.inputs.length; i++)
						if (Main.objects[Main.currTab][hline1.inputs[i]].outputs.length == 1 && Main.objects[Main.currTab][Main.objects[Main.currTab][hline1.inputs[i]].outputs[0]] == hline1)
							Main.objects[Main.currTab][hline1.inputs[i]].outputs = [];
					if (hline1.outputs.length == 1) {
						Main.objects[Main.currTab][hline1.outputs[0]].inputs = Main.objects[Main.currTab][hline1.outputs[0]].inputs.filter(function (el) {
							return Main.objects[Main.currTab][el].element.id != hline1.element.id;
						});
					}
					Main.canvas.remove(hline1.element);
					Main.canvas.remove(hline2.element);
					Main.canvas.remove(vline.element);
					delete Main.objects[Main.currTab][hline1.element.id];
					delete Main.objects[Main.currTab][hline2.element.id];
					delete Main.objects[Main.currTab][vline.element.id];
				}

				hline1 = null;
				hline2 = null;
				vline = null;
				Main.generateTruthTable();
			}
			
			creatingLine = false;
			isDrawingFromInput = false;
			isDrawingFromOutput = false;
		},

		onObjectMoving: function (options) {
			if (Main.isGate(Main.objects[Main.currTab][options.target.id].type)) {
				var startX = Main.objects[Main.currTab][options.target.id].left;
				var startY = Main.objects[Main.currTab][options.target.id].top;
				var finalX = Math.round(options.target.left / Constants.OPTS.gridSize) * Constants.OPTS.gridSize;
				var finalY = Math.round(options.target.top / Constants.OPTS.gridSize) * Constants.OPTS.gridSize;

				options.target.set({
					left: finalX,
					top: finalY
				});

				options.target.setCoords();

				Main.objects[Main.currTab][options.target.id].left = finalX;
				Main.objects[Main.currTab][options.target.id].top = finalY;

				propagateInputMovement(finalX - startX, finalY - startY, Main.objects[Main.currTab][options.target.id], 0, startX, startY);
				propagateOutputMovement(finalX - startX, finalY - startY, Main.objects[Main.currTab][options.target.id], 0, startX + 50, startY);
				
				Main.canvas.renderAll();
				Main.updateJsonOutput();
				Main.updateCost();
			} else {
				var y1 = Main.objects[Main.currTab][options.target.id].y1;
				var y2 = Main.objects[Main.currTab][options.target.id].y2;

				var element = Main.objects[Main.currTab][options.target.id];
				var inputElement = Main.objects[Main.currTab][Main.objects[Main.currTab][element.inputs[0]].element.id];
				var outputElement = Main.objects[Main.currTab][Main.objects[Main.currTab][element.outputs[0]].element.id];

				if (Math.abs(inputElement.element.x1 - options.target.x1) < 1e-6)
					inputElement.element.set({x1: options.target.left});
				else 
					inputElement.element.set({x2: options.target.left});

				if (Math.abs(outputElement.element.x1 - options.target.x1) < 1e-6)
					outputElement.element.set({x1: options.target.left});
				else 
					outputElement.element.set({x2: options.target.left});

				options.target.set({
					y1: y1,
					y2: y2,
					x1: options.target.left,
					x2: options.target.left
				});

				options.target.setCoords();


				inputElement.element.setCoords();
				outputElement.element.setCoords();
				Main.canvas.renderAll();
			}
		},

		onMouseMove: function (options) {
			if (creatingLine) {
				var pointer = Main.canvas.getPointer(options.e);
				var finalX = pointer.x;
				var finalY = pointer.y;

				hline1.element.set({
					x1: initialX,
					x2: (finalX + initialX) / 2.0,
					y1: initialY,
					y2: initialY
				});

				vline.element.set({
					x1: (finalX + initialX) / 2.0,
					x2: (finalX + initialX) / 2.0,
					y1: initialY,
					y2: finalY
				});

				hline2.element.set({
					x1: (finalX + initialX) / 2.0,
					x2: finalX,
					y1: finalY,
					y2: finalY
				});

				vline.y1 = vline.element.y1;
				vline.y2 = vline.element.y2;

				hline1.element.setCoords();
				hline2.element.setCoords();
				vline.element.setCoords();

				Main.canvas.renderAll();
			}

			var pointer = Main.canvas.getPointer(options.e);
			var x = pointer.x;
			var y = pointer.y;

			while (selectableIndicator.length > 0)
				Main.canvas.remove(selectableIndicator.pop());

			for (var key in Main.objects[Main.currTab]) {
				var obj = Main.objects[Main.currTab][key].element;
				var connectedInput = obj.left - 15 <= x && x <= obj.left && obj.top + 5 <= y && y <= obj.top + 45;
				var connectedOutput = obj.left + 50 <= x && x <= obj.left + 65 && obj.top <= y && y <= obj.top + 50;

				if (connectedOutput && Main.objects[Main.currTab][key].type != Constants.TYPES.OUTPUT_GATE && Main.isGate(Main.objects[Main.currTab][key].type)) {
					var centerX = obj.left;
					var centerY = obj.top + 25;
					var currObject = new fabric.Circle({
						radius: 5,
						top: centerY - 3.5,
						left: centerX + 48,
						fill: "#81a2be",
						opacity: 0.8,
						selectable: false
					});
					selectableIndicator.push(currObject);
					Main.canvas.add(currObject);
				} else if (connectedInput && Main.objects[Main.currTab][key].type != Constants.TYPES.INPUT_GATE && Main.isGate(Main.objects[Main.currTab][key].type)) {
					var centerX = obj.left;
					var centerY = y;
					var currObject = new fabric.Circle({
						radius: 5,
						top: centerY - 3.5,
						left: centerX - 6,
						fill: "#81a2be",
						opacity: 0.8,
						selectable: false
					});
					selectableIndicator.push(currObject);
					Main.canvas.add(currObject);
				}			
			}
		},

		onMouseDown: function (options) {
			mouseDownTime = new Date().getTime();
			if (!creatingLine) {
				for (var key in Main.objects[Main.currTab]) {
					var obj = Main.objects[Main.currTab][key].element;

					var pointer = Main.canvas.getPointer(options.e);
					var x = pointer.x;
					var y = pointer.y;

					
					if (Main.isGate(Main.objects[Main.currTab][key].type)) {
						var connectedInput = obj.left - 10 <= x && x <= obj.left && obj.top <= y && y <= obj.top + obj.height;
						var connectedOutput = obj.left + 50 <= x && x <= obj.left + 60 && obj.top + 20 <= y && y <= obj.top + 30;

						if (connectedInput || connectedOutput) {
							if (connectedOutput && Main.objects[Main.currTab][key].type == Constants.TYPES.OUTPUT_GATE)
								continue;
							if (connectedInput && Main.objects[Main.currTab][key].type == Constants.TYPES.INPUT_GATE)
								continue;
							if (connectedOutput && Main.objects[Main.currTab][key].type == Constants.TYPES.INPUT_GATE)
								isDrawingFromInput = true;
							if (connectedInput && Main.objects[Main.currTab][key].type == Constants.TYPES.OUTPUT_GATE)
								isDrawingFromOutput = true;
							creatingLine = true;

							initialX = obj.left;
							initialY = y;

							if (connectedOutput) {
								initialX = obj.left + 50;
								initialY = obj.top + 25;
							}

							var hlineElement1 = new fabric.Line([initialX, initialY, initialX, initialY], {
								stroke: '#81a2be',
								id: Main.currObjectId++,
								selectable: false,
								strokeWidth: 3
							});

							var hlineElement2 = new fabric.Line([initialX, initialY, initialX, initialY], {
								stroke: '#81a2be',
								id: Main.currObjectId++,
								selectable: false,
								strokeWidth: 3
							});

							var vlineElement = new fabric.Line([initialX, initialY, initialX, initialY], {
								stroke: '#81a2be',
								id: Main.currObjectId++,
								selectable: true,
								hasControls: false,
								strokeWidth: 3
							});

							hline1 = {
								element: hlineElement1,
								type: Constants.TYPES.HORIZONTAL_LINE,
								outputs: [],
								inputs: []
							}; 

							hline2 = {
								element: hlineElement2,
								type: Constants.TYPES.HORIZONTAL_LINE,
								outputs: [],
								inputs: []
							}

							vline = {
								element: vlineElement,
								type: Constants.TYPES.VERTICAL_LINE,
								y1: initialY,
								y2: initialY,
								outputs: [],
								inputs: []
							}; 

							Main.canvas.add(hlineElement1);
							Main.canvas.add(hlineElement2);
							Main.canvas.add(vlineElement);

							if (connectedOutput) {
								hline1.inputs.push(Main.objects[Main.currTab][key].element.id);
								hline1.outputs = [vline.element.id];

								vline.inputs.push(hline1.element.id);
								vline.outputs = [hline2.element.id];

								hline2.inputs.push(vline.element.id);

								Main.objects[Main.currTab][key].outputs.push(hline1.element.id);
							} else {
								hline1.outputs = [Main.objects[Main.currTab][key].element.id];
								vline.outputs = [hline1.element.id];
								hline2.outputs = [vline.element.id];

								Main.objects[Main.currTab][key].inputs.push(hline1.element.id);
								hline1.inputs.push(vline.element.id);
								vline.inputs.push(hline2.element.id);
							}
							Main.generateTruthTable();
						}
					}
				}
			}
		}
	}
}(Constants, Main));
var Api = (function (Constants, Main) {
	var initialGateId = 100;

	var buildCircuitTree = function (str, map, tab) {
		var currGateType, prevInputId;
		var stack = [];
		var gateIdCounter = initialGateId;
		for (var i = 0; i < str.length; i++) {
			if (str[i] == '(') {
				stack.push(str[i]);
			} else if (str[i] == ')') {
				var currGateId = gateIdCounter++;
				
				map[currGateId] = {
					id: Main.currObjectId,
					inputs: []
				};

				Main.objects[tab][Main.currObjectId] = {
					element: null,
					type: null,
					outputs: [],
					inputs: [],
					top: null,
					left: null,
					width: Constants.OPTS.gridSize,
					height: Constants.OPTS.gridSize,
					state: Constants.STATES.INPUT_OFF
				};

				Main.currObjectId++;

				while (stack[stack.length - 1] != '(') {
					if (stack[stack.length - 1] == '*' || stack[stack.length - 1] == '+') {
						currGateType = stack[stack.length - 1];
					} else if (stack[stack.length - 1] == '!') {
						var negateId = prevInput + 1;
						if (!map[negateId]) {
							map[negateId] = {
								id: Main.currObjectId,
								inputs: [prevInput]
							};

							Main.objects[tab][Main.currObjectId] = {
								element: null,
								type: Constants.TYPES.NOT_GATE,
								outputs: [],
								inputs: [],
								top: null,
								left: null,
								width: Constants.OPTS.gridSize,
								height: Constants.OPTS.gridSize,
								state: Constants.STATES.INPUT_OFF
							};

							Main.currObjectId++;
						}

						map[currGateId].inputs.push(negateId);
					} else {
						var input = parseInt(stack[stack.length - 1]);
						if (input < 100) {
							input *= 2;
							if (!map[input]) {
								map[input] = {
									id: Main.currObjectId,
									inputs: []
								};

								Main.objects[tab][Main.currObjectId] = {
									element: null,
									type: Constants.TYPES.INPUT_GATE,
									outputs: [],
									inputs: [],
									top: null,
									left: null,
									width: Constants.OPTS.gridSize,
									height: Constants.OPTS.gridSize,
									state: Constants.STATES.INPUT_OFF
								}

								Main.currObjectId++;
							}
						}
						prevInput = input;
						if (stack[stack.length - 2] != '!')
							map[currGateId].inputs.push(input);
					}
					stack.pop();
				}

				if (currGateType == '*')
					Main.objects[tab][map[currGateId].id].type = Constants.TYPES.AND_GATE;
				else
					Main.objects[tab][map[currGateId].id].type = Constants.TYPES.OR_GATE;
				
				stack.pop();
				stack.push(currGateId);
			} else {
				stack.push(str[i]);
			}
		}
		return gateIdCounter - 1;
	};

	var setMaxDepth = function (map, id, depth) {
		if (!map[id].depth)
			map[id].depth = 0;
		map[id].depth = Math.max(map[id].depth, depth);
		for (var i = 0; i < map[id].inputs.length; i++)
			setMaxDepth(map, map[id].inputs[i], depth + 1);
	};

	var createObjects = function (map, id, depths, depth, tab) {
		var inputs = map[id].inputs;
		var objectId = map[id].id;

		for (var i = 0; i < inputs.length; i++)
			createObjects(map, inputs[i], depths, depth + 1, tab);

		if (Main.objects[tab][objectId].element || map[id].depth != depth)
			return;
		
		var left = 500 - depth * 100;
		var top = 0 + depths[depth] * 50;

		Main.objects[tab][objectId].top = top;
		Main.objects[tab][objectId].left = left;
		depths[depth]++;
		Main.objects[tab][objectId].element = new Object();

		fabric.Image.fromURL(Constants.GATES[Main.objects[tab][objectId].type].url, function (oImage) {
			Main.objects[tab][oImage.id].element = oImage;
		}, {
			id: objectId,
			top: top,
			left: left,
			height: Constants.OPTS.gridSize,
			width: 50,
			hasBorders: false,
			hasControls: false,
			hasRotatingPoint: false
		});

		depths[depth]++;
	};

	var linkObjects = function (map, id, tab) {
		if (map[id].vis)
			return;
		var objectId = map[id].id;
		var inputs = map[id].inputs;

		for (var i = 0; i < inputs.length; i++) {
			var nextObjectId = map[inputs[i]].id;
			Main.wireObjects(objectId, nextObjectId, tab);
			linkObjects(map, inputs[i], tab);
		}
		map[id].vis = true;
	};

	var ret = {};

	ret.parseString = function (str, tab) {	
		var map = {}	
		var depths = [];
		
		for (var i = 0; i < 100; i++)
			depths.push(0);
		
		var outputGate = buildCircuitTree(str, map, tab);
		setMaxDepth(map, outputGate, 0);
		createObjects(map, outputGate, depths, 0, tab);
		linkObjects(map, outputGate, tab);

		fabric.Image.fromURL(Constants.GATES[Constants.TYPES.OUTPUT_GATE].url, function (oImage) {
			Main.objects[tab][oImage.id] = {
				element: oImage,
				type: Constants.TYPES.OUTPUT_GATE,
				outputs: [],
				inputs: [],
				top: 50,
				left: 600,
				state: Constants.STATES.OFF
			};
			Main.wireObjects(oImage.id, map[outputGate].id, tab);
			addAllCanvasObjects(tab);
			Main.generateTruthTable();
			Main.updateCost();
		}, {
			id: Main.currObjectId++,
			top: 50,
			left: 600,
			height: 50,
			width: 50,
			hasBorders: false,
			hasControls: false,
			hasRotatingPoint: false
		});
	};

	ret.getMinimize = function (tab) {
		var truthTable = Main.generateTruthTable();
	   	$.ajax({
	   		url: "/kmap",
	   		datatype: "json",
	   		data: JSON.stringify(truthTable),
	      	type: "POST",
	      	success: function(response){
	        	console.log(response);
	        	ret.parseString(response, tab);
	      	},
	      	error:function(error){
	        	console.log(error);
	      	}
		});
	};

	ret.importPhoto = function (formData, tab) {
		$.ajax({
			type: 'POST',
			url: '/scan',
			data: formData,
			contentType: false,
			cache: false,
			processData: false,
			async: false,
			success: function(data) {
				ret.parseString(data, tab);
			},
		});
	};

	return ret;
}(Constants, Main));
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