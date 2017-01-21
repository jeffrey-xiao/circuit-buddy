var TYPES = {
	INPUT_GATE: 0,
	OUTPUT_GATE: 1,
	AND_GATE: 2,
	NAND_GATE: 3,
	OR_GATE: 4,
	NOR_GATE: 5,
	XOR_GATE: 6,
	NXOR_GATE: 7,
	HORIZONTAL_LINE: 8,
	VERTICAL_LINE: 9
}

var TYPE_NAMES = ["Input Gate", "Output Gate", "And Gate", "Nand Gate", "Or Gate", "Nor Gate", "Xor Gate", "Nxor Gate", "Horizontal Line", "Vertical Line"];

var STATES = {
	INPUT_ON: "img/input_gate_on.png",
	INPUT_OFF: "img/input_gate_off.png",
	OUTPUT_ON: "img/output_gate_on.png",
	OUTPUT_OFF: "img/output_gate_off.png"
}

var opts = {
	height: 650,
	width: 700,
	gridSize: 50
};

var gates = [
	{
		url: STATES.INPUT_OFF,
		id: TYPES.INPUT_GATE,
		type: TYPES.INPUT_GATE
	},
	{
		url: STATES.OUTPUT_OFF,
		id: TYPES.OUTPUT_GATE,
		type: TYPES.OUTPUT_GATE
	},
	{
		url: 'img/and_gate.png',
		id: TYPES.AND_GATE,
		type: TYPES.AND_GATE
	},
	{
		url: 'img/nand_gate.png',
		id: TYPES.NAND_GATE,
		type: TYPES.NAND_GATE
	},
	{
		url: 'img/or_gate.png',
		id: TYPES.OR_GATE,
		type: TYPES.OR_GATE
	},
	{
		url: 'img/nor_gate.png',
		id: TYPES.NOR_GATE,
		type: TYPES.NOR_GATE
	},
	{
		url: 'img/xor_gate.png',
		id: TYPES.XOR_GATE,
		type: TYPES.XOR_GATE
	},
	{
		url: 'img/nxor_gate.png',
		id: TYPES.NXOR_GATE,
		type: TYPES.NXOR_GATE
	}
];

var currObjectId = 11;

/*******STRUCTURE*******\

element: oImage,
type: currGate.type,
output: null,
inputs: [],
top: currGate.id * 50,
left: 50,
state: STATES.OFF

\***********************/
var editableGates = {};
var creatingLineHorizontal = false, creatingLineVertical = false;
var hline, vline;
var mouseDownTime;

function injectLatex (table, inputs) {
	var ret = "\\begin{array}{";
	for (var i = 0; i < table[1].length; i++)
		ret += i == 0 ? "C" : "|C";
	ret += "}"
	for (var i = 0; i < table[1].length; i++) {
		if (i != 0)
			ret += "&";
		ret += i < inputs ? String.fromCharCode(65 + i) : String.fromCharCode(65 + i - inputs);
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
	$("#truth-table").text(ret);
	MathJax.Hub.Queue(["Typeset",MathJax.Hub,"truth-table"]);
}

function generateTruthTable () {
	var inputIds = [];
	var outputNodes = [];

	for (var key in editableGates) {
		if (editableGates[key].type == TYPES.INPUT_GATE)
			inputIds.push(editableGates[key].element.id);
		else if (editableGates[key].type == TYPES.OUTPUT_GATE)
			outputNodes.push(editableGates[key]);
	}
	inputIds.sort();
	outputNodes.sort(function (a, b) {
		return a.element.id - b.element.id;
	});

	var inputMap = {};

	var ret = [];
	
	for (var i = 0; i < 1 << inputIds.length; i++) {
		ret.push(new Array(inputIds.length + outputNodes.length));
		for (var j = 0; j < inputIds.length; j++) {
			inputMap[inputIds[j]] = (i & 1 << j) > 0 ? 1 : 0;
			ret[i][j] = (i & 1 << j) > 0 ? 1 : 0;
		}
		for (var j = 0; j < outputNodes.length; j++) {
			if (outputNodes[j].inputs.length == 0)
				ret[i][inputIds.length + j] = 0;
			else
				ret[i][inputIds.length + j] = getOutput(outputNodes[j].inputs[0], inputMap);
		}
	}

	injectLatex(ret, inputIds.length);
}

function getGate (type) {
	return TYPE_NAMES[type];
}

function getInputId (id) {
	var ids = [];
	
	for (var key in editableGates) {
		if (editableGates[key].type == TYPES.INPUT_GATE)
			ids.push(editableGates[key].element.id);
	}
	ids.sort();

	for (var i = 0; i < ids.length; i++)
		if (ids[i] == id) 
			return String.fromCharCode(65 + i);
}

function getOutputId (id) {
	var ids = [];
	
	for (var key in editableGates) {
		if (editableGates[key].type == TYPES.OUTPUT_GATE)
			ids.push(editableGates[key].element.id);
	}
	ids.sort();

	for (var i = 0; i < ids.length; i++)
		if (ids[i] == id) 
			return String.fromCharCode(65 + i);
}

function isGate (type) {
	return type <= 7;
}

// only have to adjust elements two deep
function propagateInputMovement (dx, dy, element, depth, prevX, prevY) {
	if (depth == 2 || !element)
		return;
	for (var i = 0; i < element.inputs.length; i++) {
		var input = element.inputs[i];
		var nextPrevX = input.element.x2;
		var nextPrevY = input.element.y2;
		if (input.type == TYPES.HORIZONTAL_LINE) {
			if (Math.abs(input.element.x2 - prevX) < 1e-6) {
				input.element.set({
					y1: input.element.y1 + dy,
					y2: input.element.y2 + dy,
					x2: input.element.x2 + dx
				});
			} else {
				input.element.set({
					y1: input.element.y1 + dy,
					y2: input.element.y2 + dy,
					x1: input.element.x1 + dx
				});
			}
		}
		else if (input.type == TYPES.VERTICAL_LINE) {
			if (Math.abs(input.element.y2 - prevY) < 1e-6) {
				input.element.set({
					y2: input.element.y2 + dy
				});
			} else {
				input.element.set({
					y1: input.element.y1 + dy
				});
			}
		}
		propagateInputMovement(dx, dy, input, depth + 1, nextPrevX, nextPrevY);
	}
}

function propagateOutputMovement (dx, dy, element, depth, prevX, prevY) {
	if (depth == 2 || !element)
		return;
	if (element.output) {
		var output = element.output;
		var nextPrevX = output.element.x2;
		var nextPrevY = output.element.y2;
		if (output.type == TYPES.HORIZONTAL_LINE) {
			if (Math.abs(output.element.x2 - prevX) < 1e-6) {
				output.element.set({
					y1: output.element.y1 + dy,
					y2: output.element.y2 + dy,
					x2: output.element.x2 + dx
				});
			} else {
				output.element.set({
					y1: output.element.y1 + dy,
					y2: output.element.y2 + dy,
					x1: output.element.x1 + dx
				});
			}
		} else if (output.type == TYPES.VERTICAL_LINE) {
			if (Math.abs(output.element.y2 - prevY) < 1e-6) {
				output.element.set({
					y2: output.element.y2 + dy
				});
			} else {
				output.element.set({
					y1: output.element.y1 + dy
				});
			}
		}
		propagateOutputMovement(dx, dy, element.output, depth + 1, nextPrevX, nextPrevY);
	}
}

function getOutput (currGate, inputMap) {
	if (!currGate)
		return 0;
	if (currGate.type == TYPES.INPUT_GATE) {
		if (inputMap)
			return inputMap[currGate.element.id];
		return currGate.state == STATES.INPUT_ON;
	}
	if (currGate.inputs.length == 0)
		return 0;
	if (currGate.type == TYPES.HORIZONTAL_LINE || currGate.type == TYPES.VERTICAL_LINE) {
		var ret = getOutput(currGate.inputs[0], inputMap);
		if (!inputMap)
			currGate.element.setStroke(ret ? "#22A80C" : "#333");
	} else if (currGate.type == TYPES.AND_GATE || currGate.type == TYPES.NAND_GATE) {
		var ret = 1;
		for (var i = 0; i < currGate.inputs.length; i++)
			ret &= getOutput(currGate.inputs[i], inputMap);
		if (currGate.type == TYPES.NAND_GATE) ret = !ret;
	} else if (currGate.type == TYPES.OR_GATE || currGate.type == TYPES.NOR_GATE) {
		var ret = 0;
		for (var i = 0; i < currGate.inputs.length; i++)
			ret |= getOutput(currGate.inputs[i], inputMap);
		if (currGate.type == TYPES.NOR_GATE) ret = !ret;
	} else if (currGate.type == TYPES.XOR_GATE || currGate.type == TYPES.NXOR_GATE) {
		var ret = 0;
		for (var i = 0; i < currGate.inputs.length; i++)
			ret ^= getOutput(currGate.inputs[i], inputMap);
		if (currGate.type == TYPES.NXOR_GATE) ret = !ret;
	}
	return ret;
}

function updateOutputs (canvas) {
	for (var key in editableGates) {
		var currGate = editableGates[key];
		if (currGate.type == TYPES.OUTPUT_GATE) {
			var currState = STATES.OUTPUT_OFF;
			if (currGate.inputs.length > 0)
				currState = getOutput(currGate.inputs[0], null) == 1 ? STATES.OUTPUT_ON : STATES.OUTPUT_OFF;
			currGate.element.setSrc(currState, function () {
				canvas.renderAll();
			});
		}
	}
}

function init () {
	// initialize the canvas
	var canvas = new fabric.Canvas('editor');
	canvas.setWidth(opts.width);
	canvas.setHeight(opts.height);

	// initialize grid
	for (var i = 0; i < opts.width / opts.gridSize; i++) {
		canvas.add(new fabric.Line([i * opts.gridSize, 0, i * opts.gridSize, opts.height], {
			stroke: '#ddd',
			selectable: false
		}));
	}

	for (var i = 0; i < opts.height / opts.gridSize; i++) {
		canvas.add(new fabric.Line([0, i * opts.gridSize, opts.width, i * opts.gridSize], {
			stroke: '#ddd',
			selectable: false
		}))
	}

	// initialize 'toolbox'
	for (var i = 0; i < gates.length; i++) {
		var currGate = gates[i];
		fabric.Image.fromURL(currGate.url, function (oImage) {
			canvas.add(oImage);
		}, {
			id: currGate.id,
			selectable: false,
			isToolbox: true,
			top: i * 50
		});
	}

	canvas.on('mouse:over', function (options) {
		if (options.target && options.target.id >= 11) {
			var id = options.target.id;
			if (editableGates[id].type == TYPES.INPUT_GATE)
				$('#current-hovered-element').text("Hovered: Input Gate: " + getInputId(id));
			else if (editableGates[id].type == TYPES.OUTPUT_GATE)
				$('#current-hovered-element').text("Hovered: Output Gate: " + getOutputId(id));
			else
				$('#current-hovered-element').text("Hovered: " + getGate(editableGates[id].type));
		} else {
			$('#current-hovered-element').text("Hovered: No element.");
		}
	});

	canvas.on('mouse:up', function (options) {
		// handling clicks
		if (new Date().getTime() - mouseDownTime < 100) {
			if (options.target && options.target.isToolbox) {
				var currGate = gates[options.target.id];
				fabric.Image.fromURL(currGate.url, function (oImage) {
					canvas.add(oImage);
					editableGates[oImage.id] = {
						element: oImage,
						type: currGate.type,
						output: null,
						inputs: [],
						top: currGate.id * 50,
						left: 50,
						state: STATES.INPUT_OFF
					};
					generateTruthTable();
				}, {
					id: currObjectId++,
					top: currGate.id * 50,
					left: 50,
					hasBorders: false,
					hasControls: false,
					hasRotatingPoint: false
				});
			} else if (options.target && editableGates[options.target.id].type == TYPES.INPUT_GATE) {
				var currGate = editableGates[options.target.id];	
				currGate.state = currGate.state == STATES.INPUT_ON ? STATES.INPUT_OFF : STATES.INPUT_ON;
				currGate.element.setSrc(currGate.state, function () {
					canvas.renderAll();
				});
				updateOutputs(canvas);
			}
		}

		if (hline && vline) {
			if (creatingLineVertical || creatingLineHorizontal) {
				var x = hline.element.x1;
				var y = hline.element.y1;

				if (creatingLineHorizontal) {
					x = vline.element.x1;
					y = vline.element.y1;
				}

				for (var key in editableGates) {
					var currGate = editableGates[key];
					if (isGate(currGate.type) && currGate.element.left - 10 <= x && x <= currGate.element.left + 10 &&
						currGate.element.top <= y && y <= currGate.element.top + 50) {
						if (creatingLineVertical) {
							hline.output = currGate;
							currGate.inputs.push(hline);
							hline.element.set({
								x1: currGate.element.left
							});
						} else {
							var newHlineElement = new fabric.Line([x, y, currGate.element.left, y], {
								stroke: '#333',
								selectable: false,
								id: currObjectId++,
								strokeWidth: 2
							});
							
							newHline = {
								element: newHlineElement,
								type: TYPES.HORIZONTAL_LINE,
								output: currGate,
								inputs: [vline]
							};

							canvas.add(newHlineElement);

							vline.output = newHline;
							currGate.inputs.push(newHline);
						}
						updateOutputs(canvas);
						generateTruthTable();
						canvas.renderAll();
					}
					if (isGate(currGate.type) && currGate.element.left + 40 <= x && x <= currGate.element.left + 60 &&
						currGate.element.top + 20 <= y && y <= currGate.element.top + 30) {
						hline.inputs.push(currGate);
						if (hline.output) {
							if (Math.abs(hline.output.element.y1 - hline.element.y1) < 1e-6)
								hline.output.element.set({
									y1: currGate.element.top + 25
								});
							if (Math.abs(hline.output.element.y2 - hline.element.y1) < 1e-6)
								hline.output.element.set({
									y2: currGate.element.top + 25
								});
						}
						currGate.output = hline;
						hline.element.set({
							x1: currGate.element.left + 50,
							y1: currGate.element.top + 25,
							y2: currGate.element.top + 25
						});
						
						updateOutputs(canvas);
						generateTruthTable();
						canvas.renderAll();
					}
				}
			}
			editableGates[hline.element.id] = hline;
			editableGates[vline.element.id] = vline;
			hline = null;
			vline = null;
		}
		creatingLineVertical = false;
		creatingLineHorizontal = false;
		canvas.selection = true;
	});

	canvas.on('object:moving', function (options) {
		var initialX = editableGates[options.target.id].left;
		var initialY = editableGates[options.target.id].top;
		var finalX = Math.round(options.target.left / opts.gridSize) * opts.gridSize;
		var finalY = Math.round(options.target.top / opts.gridSize) * opts.gridSize;

		options.target.set({
			left: finalX,
			top: finalY
		});
		editableGates[options.target.id].left = finalX;
		editableGates[options.target.id].top = finalY;
		propagateInputMovement(finalX - initialX, finalY - initialY, editableGates[options.target.id], 0, initialX, initialY);
		propagateOutputMovement(finalX - initialX, finalY - initialY, editableGates[options.target.id], 0, initialX + 50, initialY);
		canvas.renderAll();
	});

	canvas.on('mouse:move', function (options) {
		if (creatingLineHorizontal) {
			var pointer = canvas.getPointer(options.e);
			var x = pointer.x;
			var y = pointer.y;
			hline.element.set({
				x1: x
			});

			vline.element.set({
				x1: x,
				x2: x,
				y1: y
			});

			canvas.renderAll();
		} else if (creatingLineVertical) {
			var pointer = canvas.getPointer(options.e);
			var x = pointer.x;
			var y = pointer.y;
			vline.element.set({
				y1: y
			});

			hline.element.set({
				y1: y,
				y2: y,
				x1: x
			});

			canvas.renderAll();
		}
	});

	canvas.on('mouse:down', function (options) {
		mouseDownTime = new Date().getTime();
		if (!creatingLineVertical && !creatingLineHorizontal) {
			for (var key in editableGates) {
				var obj = editableGates[key].element;

				// adding to left of editable object
				var pointer = canvas.getPointer(options.e);
				var x = pointer.x;
				var y = pointer.y;

				
				if (isGate(editableGates[key].type)) {
					var connectedInput = obj.left - 10 <= x && x <= obj.left && obj.top <= y && y <= obj.top + obj.height;
					var connectedOutput = obj.left + 50 <= x && x <= obj.left + 60 && obj.top + 20 <= y && y <= obj.top + 30;

					if (connectedInput) {
						creatingLineHorizontal = true;
						canvas.selection = false;

						var hlineElement = new fabric.Line([obj.left, y, obj.left, y], {
							stroke: '#333',
							selectable: false,
							id: currObjectId++,
							strokeWidth: 2
						});

						var vlineElement = new fabric.Line([obj.left, y, obj.left, y], {
							stroke: '#333',
							selectable: false,
							id: currObjectId++,
							strokeWidth: 2
						});

						canvas.add(hlineElement);
						canvas.add(vlineElement);

						hline = {
							element: hlineElement,
							type: TYPES.HORIZONTAL_LINE,
							output: obj,
							inputs: []
						}; 

						vline = {
							element: vlineElement,
							type: TYPES.VERTICAL_LINE,
							output: hline,
							inputs: []
						}; 

						hline.inputs.push(vline);
						editableGates[key].inputs.push(hline);
						generateTruthTable();
					} else if (connectedOutput) {
						creatingLineHorizontal = true;
						canvas.selection = false;

						var hlineElement = new fabric.Line([obj.left + 50, obj.top + 25, obj.left + 50, obj.top + 25], {
							stroke: '#333',
							selectable: false,
							id: currObjectId++,
							strokeWidth: 2
						});

						var vlineElement = new fabric.Line([obj.left + 50, obj.top + 25, obj.left + 50, obj.top + 25], {
							stroke: '#333',
							selectable: false,
							id: currObjectId++,
							strokeWidth: 2
						});

						canvas.add(hlineElement);
						canvas.add(vlineElement);


						vline = {
							element: vlineElement,
							type: TYPES.VERTICAL_LINE,
							output: null,
							inputs: []
						}; 

						hline = {
							element: hlineElement,
							type: TYPES.HORIZONTAL_LINE,
							output: vline,
							inputs: [editableGates[key]]
						}; 

						vline.inputs.push(hline);
						editableGates[key].output = hline;
						generateTruthTable();
					}
				} else {
					var connected = Math.abs(obj.x1 - x) <= 5 && Math.abs(obj.y1 - y) <= 5;
					if (connected) {

						canvas.selection = false;

						if (editableGates[key].type == TYPES.HORIZONTAL_LINE) {
							creatingLineHorizontal = true;
							hline = editableGates[key];

							var vlineElement = new fabric.Line([obj.x1, obj.y1, obj.x1, obj.y1], {
								stroke: '#333',
								selectable: false,
								id: currObjectId++,
								strokeWidth: 2
							});

							canvas.add(vlineElement);

							vline = {
								element: vlineElement,
								type: TYPES.VERTICAL_LINE,
								output: null,
								inputs: []
							}

							if (hline.output) {
								hline.inputs.push(vline);
								vline.output = hline;
							} else {
								vline.inputs.push(hline);
								hline.output = vline;
							}
						} else {
							creatingLineVertical = true;
							vline = editableGates[key];

							var hlineElement = new fabric.Line([obj.x1, obj.y1, obj.x1, obj.y1], {
								stroke: '#333',
								selectable: false,
								id: currObjectId++,
								strokeWidth: 2
							});

							canvas.add(hlineElement);

							hline = {
								element: hlineElement,
								type: TYPES.HORIZONTAL_LINE,
								output: null,
								inputs: []
							}
							if (vline.output) {
								vline.inputs.push(hline);
								hline.output = vline;
							} else {
								hline.inputs.push(vline);
								vline.output = hline;
							}
						}
						generateTruthTable();
					}
				}
			}
		}
	});
}

$(function () {
	init();
});