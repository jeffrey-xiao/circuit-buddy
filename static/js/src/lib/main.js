var Vue = require("vue");
var Constants = require("./constants.js");
var fabric = require("fabric-webpack").fabric;
var Set = require("collections/set");
var SortedMap = require("collections/sorted-map");

var ret = {};
ret.currObjectId = Constants.OPTS.initialObjectId;
ret.currTab = 0;
ret.canvas = null;
ret.objects = {};
ret.Events = new Vue({});

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
	return type <= 9;
};

ret.isEditableObject = function (id) {
	return id >= Constants.OPTS.initialObjectId
};

// gets the previous gate of a wire
ret.getPreviousGate = function (id) {
	if (ret.objects[id].inputs.length == 0)
		return null;
	var currId = ret.objects[id].inputs[0].id;
	if (!ret.objects[currId])
		return null;
	while (!ret.isGate(ret.objects[currId].type)) {
		if (ret.objects[currId].inputs.length == 0)
			return null;
		currId = ret.objects[currId].inputs[0].id;
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
	hline1.inputs.push({
		id: vline.element.id,
		inputIndex: 0,
		outputIndex: 0
	});

	vline.outputs.push(hline1.element.id);
	vline.inputs.push({
		id: hline2.element.id,
		inputIndex: 0,
		outputIndex: 0
	});

	hline2.outputs.push(vline.element.id);
	hline2.inputs.push({
		id: objId2,
		inputIndex: 0,
		outputIndex: 0 
	});

	objects[objId2].outputs.push(hline2.element.id);
	objects[objId1].inputs.push({
		id: hline1.element.id,
		inputIndex: 0,
		outputIndex: 0
	});

	Vue.set(objects, hline1.element.id, hline1);
	Vue.set(objects, hline2.element.id, hline2);
	Vue.set(objects, vline.element.id, vline);
};

ret.containsInput = function (inputs, id) {
	for (var i = 0; i < inputs.length; i++)
		if (inputs[i].id == id)
			return true;
	return false;
};

ret.topSort = function topSort (vis, sorted, key) {
	vis.add(key);
	for (var i = 0; i < ret.objects[key].inputs.length; i++) {
		var nextKey = ret.objects[key].inputs[i].id;
		if (vis.has(nextKey))
			continue;
		topSort(vis, sorted, nextKey);
	}
	sorted.add(ret.objects[key]);
};

ret.getOutputs = function (inputMap) {
	var vis = new Set();
	var sorted = [];

	for (var key in ret.objects)
		if (!vis.has(key))
			ret.topSort(vis, sorted, key);

	var computedOutputs = [];
	var outputMap = new SortedMap();

	for (var i = 0; i < sorted.length; i++) {
		computedOutputs.push(0);

		var inputs = [];

		if (sorted[i].type == Constants.TYPES.INPUT_GATE)
			inputs = inputMap ? [inputMap[sorted[i].element.id]] : [sorted[i].state == Constants.STATES.INPUT_ON];
		else
			for (var j = 0; j < i; j++)
				if (ret.containsInput(sorted[i].inputs, sorted[j].element.id))
					inputs.push(computedOutputs[j]);

		computedOutputs[i] = sorted[i].getOutput(inputs);

		if (sorted[i].type == Constants.TYPES.OUTPUT_GATE)
			outputMap.set(""+sorted[i].element.id, computedOutputs[i]);
		if (!ret.isGate(sorted[i].type) && !inputMap)
			sorted[i].element.setStroke(computedOutputs[i] ? "#22A80C" : "#81a2be");

	}

	return outputMap;
};


ret.updateOutputs = function () {
	var outputMap = ret.getOutputs(null);

	for (var key in ret.objects) {
		var currGate = ret.objects[key];
		if (currGate.type == Constants.TYPES.OUTPUT_GATE) {
			var currState = outputMap.get(currGate.element.id) == 1 ? Constants.STATES.OUTPUT_ON : Constants.STATES.OUTPUT_OFF;
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

		var outputMap = ret.getOutputs(inputMap);

		for (var j = 0; j < outputIds.length; j++) 
			truthTable[i][inputIds.length + j] = outputMap.get(outputIds[j]);
	}

	return {
		table: truthTable,
		inputLength: inputIds.length,
		outputLength: outputIds.length
	};	
};

ret.removeAllCanvasObjects = function () {
	for (var key in ret.objects)
		ret.canvas.remove(ret.objects[key].element);
}

ret.addAllCanvasObjects = function () {
	for (var key in ret.objects)
		ret.canvas.add(ret.objects[key].element);
}

module.exports = ret;