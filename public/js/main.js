var TYPES = {
	INPUT_GATE: 0,
	OUTPUT_GATE: 1,
	AND_GATE: 2,
	OR_GATE: 3,
	XOR_GATE: 4,
	HORIZONTAL_LINE: 10,
	VERTICAL_LINE: 11
}

var STATES = {
	ON: "img/input_gate_on.png",
	OFF: "img/input_gate_off.png"
}

var opts = {
	height: 650,
	width: 700,
	gridSize: 50
};

var gates = [
	{
		url: STATES.OFF,
		id: TYPES.INPUT_GATE,
		type: TYPES.INPUT_GATE
	},
	{
		url: STATES.OFF,
		id: TYPES.OUTPUT_GATE,
		type: TYPES.OUTPUT_GATE
	},
	{
		url: 'img/and_gate.png',
		id: TYPES.AND_GATE,
		type: TYPES.AND_GATE
	}

];

var currObjectId = 11;

var editableGates = {};
var creatingLineHorizontal = false, creatingLineVertical = false;
var hline, vline;
var mouseDownTime;

function isGate (type) {
	return type <= 2;
}

// only have to adjust elements two deep
function propagateInputMovement (dx, dy, element, depth) {
	if (depth == 2 || !element)
		return;
	for (var i = 0; i < element.inputs.length; i++) {
		var input = element.inputs[i];
		if (input.type == TYPES.HORIZONTAL_LINE)
			input.element.set({
				y1: input.element.y1 + dy,
				y2: input.element.y2 + dy,
				x2: input.element.x2 + dx
			});
		else if (input.type == TYPES.VERTICAL_LINE)
			input.element.set({
				y2: input.element.y2 + dy
			});
		propagateInputMovement(dx, dy, input, depth + 1);
	}
}

function propagateOutputMovement (dx, dy, element, depth) {
	if (depth == 2 || !element)
		return;
	if (element.output) {
		var output = element.output;
		if (output.type == TYPES.HORIZONTAL_LINE)
			output.element.set({
				y1: output.element.y1 + dy,
				y2: output.element.y2 + dy,
				x2: output.element.x2 + dx
			});
		else if (output.type == TYPES.VERTICAL_LINE)
			output.element.set({
				y2: output.element.y2 + dy
			});
		propagateOutputMovement(dx, dy, element.output, depth + 1);
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
			stroke: '#ccc',
			selectable: false
		}));
	}

	for (var i = 0; i < opts.height / opts.gridSize; i++) {
		canvas.add(new fabric.Line([0, i * opts.gridSize, opts.width, i * opts.gridSize], {
			stroke: '#ccc',
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

	canvas.on('mouse:up', function (options) {
		// handling clicks
		if (new Date().getTime() - mouseDownTime < 100) {
			if (options.target && options.target.isToolbox) {
				var currGate = gates[options.target.id];
				console.log(currGate);
				fabric.Image.fromURL(currGate.url, function (oImage) {
					canvas.add(oImage);
					editableGates[oImage.id] = {
						element: oImage,
						type: currGate.type,
						output: null,
						inputs: [],
						top: currGate.id * 50,
						left: 50,
						state: STATES.OFF
					};
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
				currGate.state = currGate.state == STATES.ON ? STATES.OFF : STATES.ON;
				currGate.element.setSrc(currGate.state, function () {
					canvas.renderAll();
				});
				canvas.renderAll();
			}
		}

		creatingLineVertical = false;
		creatingLineHorizontal = false;
		if (hline && vline) {
			editableGates[hline.element.id] = hline;
			editableGates[vline.element.id] = vline;
			hline = null;
			vline = null;
		}
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
		propagateInputMovement(finalX - initialX, finalY - initialY, editableGates[options.target.id], 0);
		propagateOutputMovement(finalX - initialX, finalY - initialY, editableGates[options.target.id], 0);
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
							stroke: '#000',
							selectable: false,
							id: currObjectId++
						});

						var vlineElement = new fabric.Line([obj.left, y, obj.left, y], {
							stroke: '#000',
							selectable: false,
							id: currObjectId++
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
					} else if (connectedOutput) {
						creatingLineHorizontal = true;
						canvas.selection = false;

						var hlineElement = new fabric.Line([obj.left + 50, obj.top + 25, obj.left + 50, obj.top + 25], {
							stroke: '#000',
							selectable: false,
							id: currObjectId++
						});

						var vlineElement = new fabric.Line([obj.left + 50, obj.top + 25, obj.left + 50, obj.top + 25], {
							stroke: '#000',
							selectable: false,
							id: currObjectId++
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
					}
				} else {
					var connected = Math.abs(obj.x1 - x) <= 5 && Math.abs(obj.y1 - y) <= 5;
					if (connected) {

						canvas.selection = false;

						if (editableGates[key].type == TYPES.HORIZONTAL_LINE) {
							creatingLineHorizontal = true;
							hline = editableGates[key];

							var vlineElement = new fabric.Line([obj.x1, obj.y1, obj.x1, obj.y1], {
								stroke: '#000',
								selectable: false,
								id: currObjectId++
							});

							canvas.add(vlineElement);

							vline = {
								element: vlineElement,
								type: TYPES.VERTICAL_LINE,
								output: null,
								inputs: [hline]
							}

							hline.output = vline;
							console.log("Created vline element");
							console.log(vlineElement);
						} else {
							creatingLineVertical = true;
							vline = editableGates[key];

							var hlineElement = new fabric.Line([obj.x1, obj.y1, obj.x1, obj.y1], {
								stroke: '#000',
								selectable: false,
								id: currObjectId++
							});

							canvas.add(hlineElement);

							hline = {
								element: hlineElement,
								type: TYPES.HORIZONTAL_LINE,
								output: null,
								inputs: [vline]
							}

							vline.output = vline;
						}
					}
				}
			}
		}
	});
}

$(function () {
	init();
});