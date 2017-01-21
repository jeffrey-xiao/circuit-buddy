var TYPES = {
	AND_GATE: 0,
	OR_GATE: 1,
	XOR_GATE: 2,
	HORIZONTAL_LINE: 10,
	VERTICAL_LINE: 11
}

var opts = {
	height: 650,
	width: 700,
	gridSize: 50
};

var gates = [
	{
		url: 'img/and_gate.png',
		id: 0,
		type: TYPES.AND_GATE
	}
];

var currObjectId = 11;

var editableGates = {};
var creatingLine = false;
var hline, vline;

// only have to adjust elements two deep
function propagateMovement (dx, dy, element, depth) {
	if (depth == 2)
		return;
	for (var input in element.inputs) {
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
	}
}

function init () {
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
		var gate = fabric.Image.fromURL(currGate.url, function (oImage) {
			canvas.add(oImage);
		}, {
			id: currGate.id,
			selectable: false
		});
	}

	canvas.on('mouse:up', function (options) {
		if (options.target && options.target.id <= 10) {
			var currGate = gates[options.target.id];
			fabric.Image.fromURL(currGate.url, function (oImage) {
				canvas.add(oImage);
				editableGates[oImage.id] = {
					element: oImage,
					type: currGate.type,
					output: null,
					inputs: []
				};
			}, {
				id: currObjectId++,
				top: 20,
				left: 30,
				hasBorders: false,
				hasControls: false,
				hasRotatingPoint: false
			});
		}
		creatingLine = false;
		if (hline && vline) {
			editableGates[hline.element.id] = hline;
			editableGates[vline.element.id] = vline;
			hline = null;
			vline = null;
		}
		canvas.selection = true;
	});

	canvas.on('object:moving', function (options) {
		var initialX = options.target.left;
		var initialY = options.target.top;
		var finalX = Math.round(options.target.left / opts.gridSize) * opts.gridSize;
		var finalY = Math.round(options.target.top / opts.gridSize) * opts.gridSize;

		options.target.set({
			left: finalX,
			top: finalY
		});

		propagateMovement(finalX - initialX, finalY - initialY, editableGates[options.target.id], 0);
		canvas.renderAll();
	});

	canvas.on('mouse:move', function (options) {
		if (creatingLine) {
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
		}
	});

	canvas.on('mouse:down', function (options) {
		if (!creatingLine) {
			for (var key in editableGates) {
				var obj = editableGates[key].element;

				// adding to left of editable object
				var pointer = canvas.getPointer(options.e);
				var x = pointer.x;
				var y = pointer.y;
				if (obj.left - 10 <= x && x <= obj.left &&
					obj.top + obj.height >= y && y >= obj.top) {
					creatingLine = true;
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
				}
			}
		}
	});
}

$(function () {
	init();
});