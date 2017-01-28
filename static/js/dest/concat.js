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

	ret.getPreviousGate = function (id) {
		if (ret.objects[id].inputs.length == 0)
			return null;
		var currId = ret.objects[id].inputs[0];
		if (!ret.objects[currId])
			return null;
		while (!ret.isGate(ret.objects[currId].type)) {
			if (ret.objects[currId].inputs.length == 0)
				return null;
			currId = ret.objects[currId].inputs[0];
			if (!ret.objects[currId])
				return null;
		}
		return currId;
	}

	ret.getCost = function (objects) {
		var cost = 0;
		for (var key in objects) {
			var element = objects[key];
			if (element.type == Constants.TYPES.NOT_GATE) {
				// if not connected to input gate, cost is one
				var previousGateId = ret.getPreviousGate(key);
				if (element.inputs.length == 0 || previousGateId == null || ret.objects[previousGateId].type != Constants.TYPES.INPUT_GATE)
					cost += 1;
			} else if (element.type != Constants.TYPES.INPUT_GATE && element.type != Constants.TYPES.OUTPUT_GATE && ret.isGate(element.type)) {
				cost += 1 + objects[key].inputs.length;
			}
		}
		return cost;
	};


	ret.wireObjects = function (objId1, objId2, objects, outputInputLength) {
		var obj1 = objects[objId1];
		var obj2 = objects[objId2];

		var x1 = obj1.left;
		var x2 = obj2.left + Constants.OPTS.gridSize;

		var y1 = obj1.top + Constants.OPTS.gridSize / 2;
		if (obj1.type != Constants.TYPES.OUTPUT_GATE)
			y1 = obj1.top + 5 + 40 / (outputInputLength + 1) * (obj1.inputs.length + 1);

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
				console.log(currGate);
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
				inputIds.push(key);
			else if (objects[key].type == Constants.TYPES.OUTPUT_GATE) {
				outputIds.push(key);
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
		var tableObject = ret.getTruthTable(objects);
		var table = tableObject.table;
		var inputLength = tableObject.inputLength;
		if (table.length == 0) {
			return "\\begin{array}{}\\\\\\hline \\\\\\end{array}";
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
var CanvasEvents = (function (Constants, Main) {
	var hline1, hline2, vline, startComponentId;
	var initialX, initialY;
	var mouseDownTime;
	var isDrawingFromInput = false, isDrawingFromOutput = false, creatingLine = false, isDeleting = false;
	var selectableIndicator = [];

	var propagateInputMovement = function (dx, dy, element, depth, prevX, prevY) {
		if (depth == 2 || !element)
			return;
		for (var i = 0; i < element.inputs.length; i++) {
			var input = Main.objects[element.inputs[i]];
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
					input.y1 = input.element.y1;
					input.y2 = input.element.y2;
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
			var output = Main.objects[element.outputs[i]];
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
					output.y1 = output.element.y1;
					output.y2 = output.element.y2;
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
		
		for (var key in Main.objects)
			if (Main.objects[key].type == Constants.TYPES.INPUT_GATE)
				ids.push(Main.objects[key].element.id);

		ids.sort();

		for (var i = 0; i < ids.length; i++)
			if (ids[i] == id) 
				return String.fromCharCode(65 + i);
	};

	var getOutputId = function (id) {
		var ids = [];
		
		for (var key in Main.objects)
			if (Main.objects[key].type == Constants.TYPES.OUTPUT_GATE)
				ids.push(Main.objects[key].element.id);

		ids.sort();

		for (var i = 0; i < ids.length; i++)
			if (ids[i] == id) 
				return String.fromCharCode(88 + i);
	};

	var removeObject = function (element, depth) {
		if (depth == 4 || !element || !element.element)
			return;

		for (var i = 0; i < element.inputs.length; i++) {
			var nextInputElement = Main.objects[element.inputs[i]];
			var index = nextInputElement.outputs.indexOf(element.element.id);
			nextInputElement.outputs.splice(index);
			removeObject(nextInputElement, depth + 1);
		}

		for (var i = 0; i < element.outputs.length; i++) {
			var nextOutputElement = Main.objects[element.outputs[i]];
			var index = nextOutputElement.inputs.indexOf(element.element.id);
			nextOutputElement.inputs.splice(index);
			removeObject(nextOutputElement, depth + 1);
		}

		Main.canvas.remove(element.element);
		Vue.delete(Main.objects, element.element.id);
	};

	return {
		onKeyDown: function (e) {
			var key = e.keyCode ? e.keyCode : e.which;
			if (key == 8)
				isDeleting = true;
		},


		onKeyUp: function (e) {
			var key = e.keyCode ? e.keyCode : e.which;
			if (key == 8)
				isDeleting = false;
		},

		// displaying the name of the component when hovering over
		onMouseOver: function (options) {
			if (options.target && Main.isEditableObject(options.target.id)) {
				var id = options.target.id;
				if (isDeleting) {
					removeObject(Main.objects[id], 0);
					
				} else if (Main.objects[id]) {
					if (Main.objects[id].type == Constants.TYPES.INPUT_GATE)
						$('#current-hovered-element').text("Hovered: Input Gate: " + getInputId(id) + ".");
					else if (Main.objects[id].type == Constants.TYPES.OUTPUT_GATE)
						$('#current-hovered-element').text("Hovered: Output Gate: " + getOutputId(id) + ".");
					else
						$('#current-hovered-element').text("Hovered: " + Main.getGate(Main.objects[id].type) + ".");
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
						Vue.set(Main.objects, oImage.id, {
							element: oImage,
							type: currGate.type,
							outputs: [],
							inputs: [],
							top: currGate.id * Constants.OPTS.gridSize,
							left: Constants.OPTS.gridSize,
							width: Constants.OPTS.gridSize,
							height: Constants.OPTS.gridSize,
							state: Constants.STATES.INPUT_OFF
						});
						
						
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
				else if (options.target && Main.objects[options.target.id] && 
						 Main.objects[options.target.id].type == Constants.TYPES.INPUT_GATE) {

					var currGate = Main.objects[options.target.id];	
					currGate.state = currGate.state == Constants.STATES.INPUT_ON ? Constants.STATES.INPUT_OFF : 
																				   Constants.STATES.INPUT_ON;

					currGate.element.setSrc(currGate.state, function () {
						Main.canvas.renderAll();
					});

					Main.updateOutputs();
					
				}
			}
			
			// finishing wire connection
			if (hline1 && hline2 && vline && creatingLine) {
				var x = hline2.element.x2;
				var y = hline2.element.y2;
				var connected = false;
				Vue.set(Main.objects, hline1.element.id, hline1);
				Vue.set(Main.objects, hline2.element.id, hline2);
				Vue.set(Main.objects, vline.element.id, vline);

				for (var key in Main.objects) {
					var currGate = Main.objects[key];
					if (Main.isGate(currGate.type) && currGate.element.left - 10 <= x && x <= currGate.element.left + 10 &&
						currGate.element.top <= y && y <= currGate.element.top + 50) {
						if (currGate.type == Constants.TYPES.INPUT_GATE)
							continue;
						if (isDrawingFromOutput)
							continue;
						if (currGate.element.id == startComponentId)
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
						
					}
					if (Main.isGate(currGate.type) && currGate.element.left + 40 <= x && x <= currGate.element.left + 60 &&
						currGate.element.top + 20 <= y && y <= currGate.element.top + 30) {
						if (currGate.type == Constants.TYPES.OUTPUT_GATE)
							continue;
						if (isDrawingFromInput)
							continue;
						if (currGate.element.id == startComponentId)
							continue;
						hline2.inputs.push(currGate.element.id);
						if (hline2.outputs.length == 1) {
							if (Math.abs(Main.objects[hline2.outputs[0]].element.y1 - hline2.element.y2) < 1e-6) {
								Main.objects[hline2.outputs[0]].element.set({
									y1: currGate.element.top + 25
								});
								Main.objects[hline2.outputs[0]].element.setCoords();
							}
							if (Math.abs(Main.objects[hline2.outputs[0]].element.y2 - hline2.element.y2) < 1e-6) {
								Main.objects[hline2.outputs[0]].element.set({
									y2: currGate.element.top + 25
								});
								Main.objects[hline2.outputs[0]].element.setCoords();
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
						
						Main.updateOutputs();
						Main.canvas.renderAll();
						
					}
				}

				
				if (!connected) {
					for (var i = 0; i < hline1.inputs.length; i++)
						if (Main.objects[hline1.inputs[i]].outputs.length == 1 && Main.objects[Main.objects[hline1.inputs[i]].outputs[0]] == hline1)
							Main.objects[hline1.inputs[i]].outputs = [];
					if (hline1.outputs.length == 1) {
						Main.objects[hline1.outputs[0]].inputs = Main.objects[hline1.outputs[0]].inputs.filter(function (el) {
							return Main.objects[el].element.id != hline1.element.id;
						});
					}
					Main.canvas.remove(hline1.element);
					Main.canvas.remove(hline2.element);
					Main.canvas.remove(vline.element);
					Vue.delete(Main.objects, hline1.element.id);
					Vue.delete(Main.objects, hline2.element.id);
					Vue.delete(Main.objects, vline.element.id);
				}

				hline1 = null;
				hline2 = null;
				vline = null;
				startComponentId = null;				
			}
			
			creatingLine = false;
			isDrawingFromInput = false;
			isDrawingFromOutput = false;
		},

		onObjectMoving: function (options) {
			if (Main.isGate(Main.objects[options.target.id].type)) {
				var startX = Main.objects[options.target.id].left;
				var startY = Main.objects[options.target.id].top;
				var finalX = Math.round(options.target.left / Constants.OPTS.gridSize) * Constants.OPTS.gridSize;
				var finalY = Math.round(options.target.top / Constants.OPTS.gridSize) * Constants.OPTS.gridSize;

				options.target.set({
					left: finalX,
					top: finalY
				});

				options.target.setCoords();

				Main.objects[options.target.id].left = finalX;
				Main.objects[options.target.id].top = finalY;

				propagateInputMovement(finalX - startX, finalY - startY, Main.objects[options.target.id], 0, startX, startY);
				propagateOutputMovement(finalX - startX, finalY - startY, Main.objects[options.target.id], 0, startX + 50, startY);
				
				Main.canvas.renderAll();
				
			} else {
				var y1 = Main.objects[options.target.id].y1;
				var y2 = Main.objects[options.target.id].y2;

				var element = Main.objects[options.target.id];
				var inputElement = Main.objects[Main.objects[element.inputs[0]].element.id];
				var outputElement = Main.objects[Main.objects[element.outputs[0]].element.id];
				
				var xcoords = [inputElement.element.x1, inputElement.element.x2, outputElement.element.x1, outputElement.element.x2];
				var jointX;
				for (var i = 0; i < 3; i++)
					if (xcoords[i] == xcoords[i + 1])
						jointX = xcoords[i];

				if (Math.abs(inputElement.element.x1 - jointX) < 1e-6)
					inputElement.element.set({x1: options.target.left});
				else 
					inputElement.element.set({x2: options.target.left});

				if (Math.abs(outputElement.element.x1 - jointX) < 1e-6)
					outputElement.element.set({x1: options.target.left});
				else 
					outputElement.element.set({x2: options.target.left});

				element.element.set({
					y1: y1,
					y2: y2,
					x1: options.target.left,
					x2: options.target.left
				});

				inputElement.element.setCoords();
				outputElement.element.setCoords();
				element.element.setCoords();

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

			for (var key in Main.objects) {
				var obj = Main.objects[key].element;
				var connectedInput = obj.left - 15 <= x && x <= obj.left && obj.top + 5 <= y && y <= obj.top + 45;
				var connectedOutput = obj.left + 50 <= x && x <= obj.left + 65 && obj.top <= y && y <= obj.top + 50;

				if (connectedOutput && Main.objects[key].type != Constants.TYPES.OUTPUT_GATE && Main.isGate(Main.objects[key].type)) {
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
				} else if (connectedInput && Main.objects[key].type != Constants.TYPES.INPUT_GATE && Main.isGate(Main.objects[key].type)) {
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
				for (var key in Main.objects) {
					var obj = Main.objects[key].element;

					var pointer = Main.canvas.getPointer(options.e);
					var x = pointer.x;
					var y = pointer.y;

					
					if (Main.isGate(Main.objects[key].type)) {
						var connectedInput = obj.left - 10 <= x && x <= obj.left && obj.top <= y && y <= obj.top + obj.height;
						var connectedOutput = obj.left + 50 <= x && x <= obj.left + 60 && obj.top + 20 <= y && y <= obj.top + 30;

						if (connectedInput || connectedOutput) {
							if (connectedOutput && Main.objects[key].type == Constants.TYPES.OUTPUT_GATE)
								continue;
							if (connectedInput && Main.objects[key].type == Constants.TYPES.INPUT_GATE)
								continue;
							if (connectedOutput && Main.objects[key].type == Constants.TYPES.INPUT_GATE)
								isDrawingFromInput = true;
							if (connectedInput && Main.objects[key].type == Constants.TYPES.OUTPUT_GATE)
								isDrawingFromOutput = true;
							creatingLine = true;
							startComponentId = key;

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
								hline1.inputs.push(Main.objects[key].element.id);
								hline1.outputs = [vline.element.id];

								vline.inputs.push(hline1.element.id);
								vline.outputs = [hline2.element.id];

								hline2.inputs.push(vline.element.id);

								Main.objects[key].outputs.push(hline1.element.id);
							} else {
								hline1.outputs = [Main.objects[key].element.id];
								vline.outputs = [hline1.element.id];
								hline2.outputs = [vline.element.id];

								Main.objects[key].inputs.push(hline1.element.id);
								hline1.inputs.push(vline.element.id);
								vline.inputs.push(hline2.element.id);
							}
							
						}
					}
				}
			}
		}
	}
}(Constants, Main));
var Api = (function (Constants, Main) {
	// initial gate id counter when building the circuit tree
	var initialGateId = 100;

	// INPUTS:
	//  - str 		string representation of circuit
	//	- map 		map to be mutated to create the circuit tree
	// OUTPUTS:
	//  - objects   objects to be mutated to create the circuit elements 
	var buildCircuitTree = function (str, map, objects) {
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

				objects[Main.currObjectId] = {
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

							objects[Main.currObjectId] = {
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

								objects[Main.currObjectId] = {
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
					objects[map[currGateId].id].type = Constants.TYPES.AND_GATE;
				else
					objects[map[currGateId].id].type = Constants.TYPES.OR_GATE;
				
				stack.pop();
				stack.push(currGateId);
			} else {
				stack.push(str[i]);
			}
		}
		return gateIdCounter - 1;
	};

	// INPUTS:
	//  - map 		map representing circuit tree
	//  - id 		current id of element corresponding to map
	//  - depth 	current depth
	var setMaxDepth = function (map, id, depth) {
		if (!map[id].depth)
			map[id].depth = 0;
		map[id].depth = Math.max(map[id].depth, depth);
		for (var i = 0; i < map[id].inputs.length; i++)
			setMaxDepth(map, map[id].inputs[i], depth + 1);
	};

	// INPUTS:
	//  - map 		map representing circuit tree
	//  - id 		current id of element corresponding to map
	//  - depths	array of elements at a certain depth
	//  - depth 	current depth
	//  - objects 	objects to be mutated to create the circuit elements
	var createObjects = function (map, id, depths, depth, objects) {
		var inputs = map[id].inputs;
		var objectId = map[id].id;

		for (var i = 0; i < inputs.length; i++)
			createObjects(map, inputs[i], depths, depth + 1, objects);

		if (objects[objectId].element || map[id].depth != depth)
			return;
		
		var left = 500 - depth * 100;
		var top = 0 + depths[depth] * 50;

		objects[objectId].top = top;
		objects[objectId].left = left;
		depths[depth]++;
		objects[objectId].element = new Object();

		fabric.Image.fromURL(Constants.GATES[objects[objectId].type].url, function (oImage) {
			objects[oImage.id].element = oImage;
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

	// INPUTS
	//  - map 		map representing the circuit tree
	//  - id 		current id of element corresponding to map
	//  - objects 	objects to be mutated to wire the circuit elements
	var linkObjects = function (map, id, objects) {
		if (map[id].vis)
			return;
		var objectId = map[id].id;
		var inputs = map[id].inputs;

		for (var i = 0; i < inputs.length; i++) {
			var nextObjectId = map[inputs[i]].id;
			Main.wireObjects(objectId, nextObjectId, objects, inputs.length);
			linkObjects(map, inputs[i], objects);
		}
		map[id].vis = true;
	};

	var ret = {};

	// INPUTS
	//  - str 		string representation of circuit
	//  - callback	function to be called. The newly generated objects is passed as an argument.
	ret.parseString = function (str, callback) {	
		var map = {}	
		var generatedObjects = {}
		var depths = [];
		
		for (var i = 0; i < 100; i++)
			depths.push(0);
		
		var outputGate = buildCircuitTree(str, map, generatedObjects);
		setMaxDepth(map, outputGate, 0);
		createObjects(map, outputGate, depths, 0, generatedObjects);
		linkObjects(map, outputGate, generatedObjects);

		fabric.Image.fromURL(Constants.GATES[Constants.TYPES.OUTPUT_GATE].url, function (oImage) {
			generatedObjects[oImage.id] = {
				element: oImage,
				type: Constants.TYPES.OUTPUT_GATE,
				outputs: [],
				inputs: [],
				top: 50,
				left: 600,
				state: Constants.STATES.OFF
			};
			Main.wireObjects(oImage.id, map[outputGate].id, generatedObjects, 1);
			callback(generatedObjects);
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

	// INPUTS
	//  - objects 		circuit elements to minimize
	//	- callback		function to call after circuit is minimized. Usually UI updates in callback.
	ret.getMinimize = function (objects, callback) {
		var truthTable = Main.getTruthTable(objects).table;
	   	$.ajax({
	   		url: "/kmap",
	   		datatype: "json",
	   		data: JSON.stringify(truthTable),
	      	type: "POST",
	      	success: function(response) {
	        	console.log(response);
	        	ret.parseString(response, callback);
	      	},
	      	error:function(error){
	        	console.log(error);
	      	}
		});
	};

	// INPUTS
	//  - formData 		data of image to process
	//  - callback		function to call after image of circuit is imported. Usually UI updates in callback.
	ret.importPhoto = function (formData, callback) {
		$.ajax({
			type: 'POST',
			url: '/scan',
			data: formData,
			contentType: false,
			cache: false,
			processData: false,
			async: false,
			success: function (response) {
				console.log(response);
				ret.parseString(response, callback);
			},
			error: function (error) {
				console.log(error);
			}
		});
	};

	return ret;
}(Constants, Main));
var Ui = (function (Constants, Main, Api) {
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
		}
	});

	Vue.component('truth-table-content', {
		template: "<div id='truth-table-content' v-html='html'></div>",
		props: ["objects"],
		computed: {
			html: function () {
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
					removeAllCanvasObjects();
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
					removeAllCanvasObjects();
					Main.objects = ref.objectsList[index];
					addAllCanvasObjects();
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
						removeAllCanvasObjects();
						Main.objects = ref.objectsList[index];
					}
					addAllCanvasObjects();
					Main.updateOutputs();
				});
				Events.$on('tabs:import-tabs', function (objectsListJson) {
					removeAllCanvasObjects();
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
						addAllCanvasObjects();
						Main.updateOutputs();
						
					});
				});
				Events.$on('simplify:clicked', function () {
					var index = ref.tabs.findIndex(tab => tab.id == ref.activeTab);
					ref.addTab()
					Api.getMinimize(ref.objectsList[index], function (objects) {
						Vue.set(ref.objectsList, ref.objectsList.length - 1, objects);
						Main.objects = objects;
						addAllCanvasObjects();
						Main.updateOutputs();
					});
				});
				Events.$on('tabs:import-photo', function (file) {
					ref.addTab();
					Api.importPhoto(file, function (objects) {
						Vue.set(ref.objectsList, ref.objectsList.length - 1, objects);
						Main.objects = objects;
						addAllCanvasObjects();
						Main.updateOutputs();
					});
				});
			}
		});
	});

	return {};
}(Constants, Main, Api));
function removeAllCanvasObjects () {
	for (var key in Main.objects)
		Main.canvas.remove(Main.objects[key].element);
}

function addAllCanvasObjects () {
	for (var key in Main.objects)
		Main.canvas.add(Main.objects[key].element);
}

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