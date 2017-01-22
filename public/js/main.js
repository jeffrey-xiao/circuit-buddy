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

var TYPE_NAMES = ["Input Gate", "Output Gate", "And Gate", "Nand Gate", "Or Gate", 
				  "Nor Gate", "Xor Gate", "Nxor Gate", "Horizontal Line", "Vertical Line"];

var STATES = {
	INPUT_ON: "img/input_gate_on.png",
	INPUT_OFF: "img/input_gate_off.png",
	OUTPUT_ON: "img/output_gate_on.png",
	OUTPUT_OFF: "img/output_gate_off.png"
}

var opts = {
	height: Math.round((window.innerHeight - 145) / 50.0) * 50,
	width: Math.round((window.outerWidth- 332) / 50.0) * 50,
	gridSize: 50//(window.outerWidth-330)/17
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
var currTab = 0;

/*******STRUCTURE*******\

element: oImage,
type: currGate.type,
output: null,
inputs: [],
top: currGate.id * 50,
left: 50,
state: STATES.OFF

\***********************/
var editableGates = [{}];
var creatingLine = false;
var hline1, hline2, vline;
var initialX, initialY;
var mouseDownTime;
var isDeleting = false;
var canvas;

$.getScript("tabs_test.js", function(){

   alert("Script loaded but not necessarily executed.");

});

function injectLatex (table, inputs) {
	if (table.length == 0) {
		$("#truth-table-content").text("");
		return;
	}
	var ret = "\\begin{array}{";
	for (var i = 0; i < table[0].length; i++)
		ret += i == 0 ? "C" : "|C";
	ret += "}"
	for (var i = 0; i < table[0].length; i++) {
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
	$("#truth-table-content").text(ret);
	MathJax.Hub.Queue(["Typeset",MathJax.Hub,"truth-table"]);
}

function generateTruthTable () {
	var inputIds = [];
	var outputNodes = [];

	for (var key in editableGates[currTab]) {
		if (editableGates[currTab][key].type == TYPES.INPUT_GATE)
			inputIds.push(editableGates[currTab][key].element.id);
		else if (editableGates[currTab][key].type == TYPES.OUTPUT_GATE)
			outputNodes.push(editableGates[currTab][key]);
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
	
	for (var key in editableGates[currTab]) {
		if (editableGates[currTab][key].type == TYPES.INPUT_GATE)
			ids.push(editableGates[currTab][key].element.id);
	}
	ids.sort();

	for (var i = 0; i < ids.length; i++)
		if (ids[i] == id) 
			return String.fromCharCode(65 + i);
}

function getOutputId (id) {
	var ids = [];
	
	for (var key in editableGates[currTab]) {
		if (editableGates[currTab][key].type == TYPES.OUTPUT_GATE)
			ids.push(editableGates[currTab][key].element.id);
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
	for (var i = 0; i < element.outputs.length; i++) {
		var output = element.outputs[i];
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
		propagateOutputMovement(dx, dy, output, depth + 1, nextPrevX, nextPrevY);
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
			currGate.element.setStroke(ret ? "#22A80C" : "#81a2be");
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
	for (var key in editableGates[currTab]) {
		var currGate = editableGates[currTab][key];
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

function removeObject (element, depth, canvas) {
	if (depth == 4)
		return;
	for (var i = 0; i < element.inputs.length; i++)
		removeObject(element.inputs[i], depth + 1, canvas);
	for (var i = 0; i < element.outputs.length; i++)
		removeObject(element.outputs[i], depth + 1, canvas);
	canvas.remove(element.element);
	delete editableGates[currTab][element.element.id];
}


function init () {
	// initialize the canvas
	canvas = new fabric.Canvas('editor');
	canvas.setWidth(opts.width);
	canvas.setHeight(opts.height);
	canvas.selection = false;

	// initialize grid
	for (var i = 1; i < opts.width / opts.gridSize; i++) {
		canvas.add(new fabric.Line([i * opts.gridSize, 0, i * opts.gridSize, opts.height], {
			stroke: '#373b41',
			selectable: false 
		}));
	}

	for (var i = 1; i < opts.height / opts.gridSize; i++) {
		canvas.add(new fabric.Line([opts.gridSize, i * opts.gridSize, opts.width, i * opts.gridSize], {
			stroke: '#373b41',
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
			top: i * opts.gridSize,
			height: opts.gridSize,
			width: opts.gridSize
		});
	}

	canvas.on('mouse:over', function (options) {
		if (options.target && options.target.id >= 11) {
			var id = options.target.id;
			if (isDeleting) {
				removeObject(editableGates[currTab][id], 0, canvas);
			} else {
				if (editableGates[currTab][id].type == TYPES.INPUT_GATE)
					$('#current-hovered-element').text("Hovered: Input Gate: " + getInputId(id));
				else if (editableGates[currTab][id].type == TYPES.OUTPUT_GATE)
					$('#current-hovered-element').text("Hovered: Output Gate: " + getOutputId(id));
				else
					$('#current-hovered-element').text("Hovered: " + getGate(editableGates[currTab][id].type));
			}
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
					editableGates[currTab][oImage.id] = {
						element: oImage,
						type: currGate.type,
						outputs: [],
						inputs: [],
						top: currGate.id * opts.gridSize,
						left: opts.gridSize,
						width: opts.gridSize,
						height: opts.gridSize,
						state: STATES.INPUT_OFF
					};
					generateTruthTable();
				}, {
					id: currObjectId++,
					top: currGate.id * opts.gridSize,
					left: opts.gridSize,
					height: opts.gridSize,
					width: opts.gridSize,
					hasBorders: false,
					hasControls: false,
					hasRotatingPoint: false
				});
			} else if (options.target && editableGates[currTab][options.target.id] && editableGates[currTab][options.target.id].type == TYPES.INPUT_GATE) {
				var currGate = editableGates[currTab][options.target.id];	
				currGate.state = currGate.state == STATES.INPUT_ON ? STATES.INPUT_OFF : STATES.INPUT_ON;
				currGate.element.setSrc(currGate.state, function () {
					canvas.renderAll();
				});
				updateOutputs(canvas);
			}
		}
		
		if (hline1 && hline2 && vline && creatingLine) {
			var x = hline2.element.x2;
			var y = hline2.element.y2;
			var connected = false;

			for (var key in editableGates[currTab]) {
				var currGate = editableGates[currTab][key];
				if (isGate(currGate.type) && currGate.element.left - 10 <= x && x <= currGate.element.left + 10 &&
					currGate.element.top <= y && y <= currGate.element.top + 50) {
					if (currGate.type == TYPES.INPUT_GATE)
						continue;
					hline2.outputs.push(currGate);
					currGate.inputs.push(hline2);
					hline2.element.set({
						x2: currGate.element.left
					});
					connected = true;

					updateOutputs(canvas);
					generateTruthTable();
					canvas.renderAll();
				}
				if (isGate(currGate.type) && currGate.element.left + 40 <= x && x <= currGate.element.left + 60 &&
					currGate.element.top + 20 <= y && y <= currGate.element.top + 30) {
					if (currGate.type == TYPES.OUTPUT_GATE)
						continue;
					hline2.inputs.push(currGate);
					if (hline2.outputs.length == 1) {
						if (Math.abs(hline2.outputs[0].element.y1 - hline2.element.y2) < 1e-6)
							hline2.outputs[0].element.set({
								y1: currGate.element.top + 25
							});
						if (Math.abs(hline2.outputs[0].element.y2 - hline2.element.y2) < 1e-6)
							hline2.outputs[0].element.set({
								y2: currGate.element.top + 25
							});
					}
					currGate.outputs.push(hline2);
					hline2.element.set({
						x2: currGate.element.left + 50,
						y1: currGate.element.top + 25,
						y2: currGate.element.top + 25
					});
					connected = true;
					
					updateOutputs(canvas);
					generateTruthTable();
					canvas.renderAll();
				}
			}

			if (!connected) {
				for (var i = 0; i < hline1.inputs.length; i++)
					if (hline1.inputs[i].outputs.length == 1 && hline1.inputs[i].outputs[0] == hline1)
						hline1.inputs[i].outputs = [];
				if (hline1.outputs.length == 1)
					hline1.outputs[0].inputs = hline1.outputs[0].inputs.filter(function (el) {
						return el.element.id != hline1.element.id;
					});
				canvas.remove(hline1.element);
				canvas.remove(hline2.element);
				canvas.remove(vline.element);
			} else {
				editableGates[currTab][hline1.element.id] = hline1;
				editableGates[currTab][hline2.element.id] = hline2;
				editableGates[currTab][vline.element.id] = vline;
			}

			hline1 = null;
			hline2 = null;
			vline = null;
		}
		
		creatingLine = false;
	});

	canvas.on('object:moving', function (options) {
		var startX = editableGates[currTab][options.target.id].left;
		var startY = editableGates[currTab][options.target.id].top;
		var finalX = Math.round(options.target.left / opts.gridSize) * opts.gridSize;
		var finalY = Math.round(options.target.top / opts.gridSize) * opts.gridSize;

		options.target.set({
			left: finalX,
			top: finalY
		});

		editableGates[currTab][options.target.id].left = finalX;
		editableGates[currTab][options.target.id].top = finalY;

		propagateInputMovement(finalX - startX, finalY - startY, editableGates[currTab][options.target.id], 0, startX, startY);
		propagateOutputMovement(finalX - startX, finalY - startY, editableGates[currTab][options.target.id], 0, startX + 50, startY);
		
		canvas.renderAll();
	});

	canvas.on('mouse:move', function (options) {
		if (creatingLine) {
			var pointer = canvas.getPointer(options.e);
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

			canvas.renderAll();
		}
	});

	canvas.on('mouse:down', function (options) {
		mouseDownTime = new Date().getTime();
		if (!creatingLine) {
			for (var key in editableGates[currTab]) {
				var obj = editableGates[currTab][key].element;

				// adding to left of editable object
				var pointer = canvas.getPointer(options.e);
				var x = pointer.x;
				var y = pointer.y;

				
				if (isGate(editableGates[currTab][key].type)) {
					var connectedInput = obj.left - 10 <= x && x <= obj.left && obj.top <= y && y <= obj.top + obj.height;
					var connectedOutput = obj.left + 50 <= x && x <= obj.left + 60 && obj.top + 20 <= y && y <= obj.top + 30;

					if (connectedInput || connectedOutput) {
						if (connectedOutput && editableGates[currTab][key].type == TYPES.OUTPUT_GATE)
							continue;
						if (connectedInput && editableGates[currTab][key].type == TYPES.INPUT_GATE)
							continue;
						creatingLine = true;

						initialX = obj.left;
						initialY = y;

						if (connectedOutput) {
							initialX = obj.left + 50;
							initialY = obj.top + 25;
						}

						var hlineElement1 = new fabric.Line([initialX, initialY, initialX, initialY], {
							stroke: '#81a2be',
							selectable: true,
							id: currObjectId++,
							strokeWidth: 3
						});

						var hlineElement2 = new fabric.Line([initialX, initialY, initialX, initialY], {
							stroke: '#81a2be',
							selectable: true,
							id: currObjectId++,
							strokeWidth: 3
						});

						var vlineElement = new fabric.Line([initialX, initialY, initialX, initialY], {
							stroke: '#81a2be',
							selectable: true,
							id: currObjectId++,
							strokeWidth: 3
						});

						hline1 = {
							element: hlineElement1,
							type: TYPES.HORIZONTAL_LINE,
							outputs: [],
							inputs: []
						}; 

						hline2 = {
							element: hlineElement2,
							type: TYPES.HORIZONTAL_LINE,
							outputs: [],
							inputs: []
						}

						vline = {
							element: vlineElement,
							type: TYPES.VERTICAL_LINE,
							outputs: [],
							inputs: []
						}; 


						canvas.add(hlineElement1);
						canvas.add(hlineElement2);
						canvas.add(vlineElement);

						if (connectedOutput) {
							hline1.inputs.push(editableGates[currTab][key]);
							hline1.outputs = [vline];

							vline.inputs.push(hline1);
							vline.outputs = [hline2];

							hline2.inputs.push(vline);

							editableGates[currTab][key].outputs.push(hline1);
						} else {
							hline1.outputs = [editableGates[currTab][key]];
							vline.outputs = [hline1];
							hline2.outputs = [vline];

							editableGates[currTab][key].inputs.push(hline1);
							hline1.inputs.push(vline);
							vline.inputs.push(hline2);
						}
						generateTruthTable();
					}
				}
			}
		}
	});
}

function removeAllCanvasObjects (tab) {
	for (var key in editableGates[tab])
		canvas.remove(editableGates[tab][key].element);
}

function addAllCanvasObjects (tab) {
	for (var key in editableGates[tab])
		canvas.add(editableGates[tab][key].element);
	generateTruthTable();
}

// removes all objects from the canvas and the map
function removeAllObjects (tab) {
	for (var key in editableGates[tab]) {
		canvas.remove(editableGates[tab][key].element);
		delete editableGates[tab][key];
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
		init();
		var globalTabCounter = 2;
		// adding a tab
		$("#add-tab").click(function () {
			var len = $("div[id^='tab-']").length;
			
			$("div[id^='tab-']").each(function () {
				$(this).removeClass("active");
			});

			$("#tabs").append("<div id='tab-" + len + "' class='active tab'><span>Tab " + globalTabCounter + "</span><button id='delete-tab-" + len + "'><i class=\"el el-remove\"></i></button></div>");
			
			removeAllCanvasObjects(currTab);
			currTab = len;
			editableGates.push({});
			globalTabCounter++;
		});

		// removing the current tab
		$("body").on('click', "button[id^='delete-tab']", function () {
			var id = parseInt($(this).attr('id').split("-")[2]);
			removeAllObjects(id);
			editableGates.splice(id, 1);

			$(this).parent().remove();
			for(var i = id; i < editableGates.length; i++){
				$('#tabs .tab').eq(i).attr('id', 'tab-'+i).find('button').attr('id', 'delete-tab-'+i);
			}

			if (editableGates.length == 0) {
				editableGates.push({});
				$("#tabs").append("<div id='tab-0' class='active tab'><span>Tab "+globalTabCounter+"</span><button id='delete-tab-0'><i class=\"el el-remove\"></i></button></div>");		
				globalTabCounter = 2;
			}

			if (id == editableGates.length)
				id--;

			$("button[id='tab-" + id + "']").addClass("active");

			currTab = id;
			addAllCanvasObjects(currTab);
		});

		// switching tabs
		$("body").on('click', "div[id^='tab-']", function () {
			console.log("SWITCHING");
			var id = parseInt($(this).attr('id').split("-")[1]);
			$("div.tab.active").each(function () {
				$(this).removeClass("active");
			});
			$("div[id='tab-" + id + "']").addClass("active");
			removeAllCanvasObjects(currTab);
			addAllCanvasObjects(id);
			currTab = id;
		});
	});
});