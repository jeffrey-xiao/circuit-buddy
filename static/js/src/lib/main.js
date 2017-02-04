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
ret.customObjects = [];
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

	// initialize 'toolbox'; Excludes the custom gate object because it must be initialized by user
	for (var i = 0; i < Constants.GATES.length - 1; i++) {
		var currGate = Constants.GATES[i];
		fabric.Image.fromURL(currGate.url, function (oImage) {
			ret.canvas.add(oImage);
		}, {
			type: i,
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

ret.isCustomGate = function (type) {
	return type == 9;
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

ret.createCustomGate = function (customGateId, isToolbox, callback) {
	fabric.Image.fromURL(Constants.GATES[Constants.TYPES.CUSTOM_GATE].url, function (oImage) {
		var leftText = new fabric.Text("" + ret.customObjects[customGateId].inputLength, {
			fontFamily: 'monospace',
			left: 10,
			top: 15,
			fontSize: 20,
			fill: '#0000FF'
		});
		var rightText = new fabric.Text("" + ret.customObjects[customGateId].outputLength, {
			fontFamily: 'monospace',
			left: 30,
			top: 15,
			fontSize: 20,
			fill: '#0000FF'
		});
		var element = new fabric.Group([oImage, leftText, rightText], {
			// NOTE THAT THIS ID IS NOT THE SAME AS THE OTHER TOOL BOXES ID; SHOULD CHANGE TO ACTUAL OBJECT ID IF ISTOOLBOX IS FALSE
			id: customGateId, 
			top: (Constants.GATES.length - 1 + customGateId) * Constants.OPTS.gridSize,
			left: isToolbox ? 0 : Constants.OPTS.gridSize,
			height: Constants.OPTS.gridSize,
			width: Constants.OPTS.gridSize,
			hasBorders: false,
			hasControls: false,
			hasRotatingPoint: false,
			selectable: !isToolbox,
			isToolbox: isToolbox,
			type: Constants.TYPES.CUSTOM_GATE
		});

		ret.canvas.add(element);

		callback(element);
	});
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
		id: ret.currObjectId++,
		stroke: '#81a2be',
		selectable: false,
		strokeWidth: 3
	});

	var vlineElement = new fabric.Line([(x1 + x2) / 2.0, y1, (x1 + x2) / 2.0, y2], {
		id: ret.currObjectId++,
		stroke: '#81a2be',
		selectable: true,
		hasControls: false,
		strokeWidth: 3
	});

	var hlineElement2 = new fabric.Line([x2, y2, (x1 + x2) / 2.0, y2], {
		id: ret.currObjectId++,
		stroke: '#81a2be',
		selectable: false,
		strokeWidth: 3
	});

	var hline1 = {
		id: hlineElement1.id,
		element: hlineElement1,
		type: Constants.TYPES.HORIZONTAL_LINE,
		outputs: [],
		inputs: []
	};

	var hline2 = {
		id: hlineElement2.id,
		element: hlineElement2,
		type: Constants.TYPES.HORIZONTAL_LINE,
		outputs: [],
		inputs: []
	};

	var vline = {
		id: vlineElement.id,
		element: vlineElement,
		type: Constants.TYPES.VERTICAL_LINE,
		y1: y1,
		y2: y2,
		outputs: [],
		inputs: []
	};

	hline1.outputs.push(objId1);
	hline1.inputs.push({
		id: vline.id,
		inputIndex: 0,
		outputIndex: 0
	});

	vline.outputs.push(hline1.id);
	vline.inputs.push({
		id: hline2.id,
		inputIndex: 0,
		outputIndex: 0
	});

	hline2.outputs.push(vline.id);
	hline2.inputs.push({
		id: objId2,
		inputIndex: 0,
		outputIndex: 0 
	});

	objects[objId2].outputs.push(hline2.id);
	objects[objId1].inputs.push({
		id: hline1.id,
		inputIndex: 0,
		outputIndex: 0
	});

	Vue.set(objects, hline1.id, hline1);
	Vue.set(objects, hline2.id, hline2);
	Vue.set(objects, vline.id, vline);
};

ret.containsInput = function (inputs, id) {
	for (var i = 0; i < inputs.length; i++)
		if (inputs[i].id == id)
			return true;
	return false;
};

ret.topSort = function topSort (vis, sorted, key) {
	vis.add(parseInt(key));
	if (!ret.objects[key])
		return;
	for (var i = 0; i < ret.objects[key].inputs.length; i++) {
		var nextKey = ret.objects[key].inputs[i].id;
		if (vis.has(parseInt(nextKey)))
			continue;
		topSort(vis, sorted, nextKey);
	}
	sorted.push(ret.objects[key]);
};

ret.getOutputs = function (inputMap) {
	var vis = new Set();
	var sorted = [];

	for (var key in ret.objects)
		if (!vis.has(parseInt(key)))
			ret.topSort(vis, sorted, key);

	var computedOutputs = [];
	var outputMap = new SortedMap();

	for (var i = 0; i < sorted.length; i++) {
		computedOutputs.push([]);

		var inputs = [];

		if (sorted[i].type == Constants.TYPES.INPUT_GATE)
			inputs = inputMap ? [inputMap[sorted[i].id]] : [sorted[i].state == Constants.STATES.INPUT_ON];
		else if (!ret.isCustomGate(sorted[i].type))
			for (var j = 0; j < i; j++)
				for (var k = 0; k < sorted[i].inputs.length; k++)
					if (sorted[i].inputs[k].id == sorted[j].id)
						inputs.push(computedOutputs[j][sorted[i].inputs[k].inputIndex]);
		else {
			for (var j = 0; j < sorted[i].inputLength; j++)
				inputs.push(0);
			for (var j = 0; j < i; j++)
				for (var k = 0; k < sorted[i].inputs.length; k++)
					if (sorted[i].inputs[k].id == sorted[j].id)
						inputs[sorted[i].inputs[k].outputIndex] = computedOutputs[j][sorted[i].inputs[k].inputIndex];
		}
		
		computedOutputs[i] = sorted[i].getOutput(inputs);
		if (sorted[i].type == Constants.TYPES.OUTPUT_GATE)
			outputMap.set(parseInt(sorted[i].id), computedOutputs[i][0]);
		if (!ret.isGate(sorted[i].type) && !inputMap)
			sorted[i].element.setStroke(computedOutputs[i][0] ? "#22A80C" : "#81a2be");

	}

	return outputMap;
};


ret.updateOutputs = function () {
	var outputMap = ret.getOutputs(null);

	for (var key in ret.objects) {
		var currGate = ret.objects[key];
		if (currGate.type == Constants.TYPES.OUTPUT_GATE) {
			var currState = outputMap.get(parseInt(currGate.id)) == 1 ? Constants.STATES.OUTPUT_ON : Constants.STATES.OUTPUT_OFF;
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
			truthTable[i][inputIds.length + j] = outputMap.get(parseInt(outputIds[j]));
	}

	return {
		table: truthTable,
		inputLength: inputIds.length,
		outputLength: outputIds.length
	};	
};

ret.addCustomObject = function () {
	var customObject = {};
	customObject.type = Constants.TYPES.CUSTOM_GATE;
	customObject.id = ret.customObjects.length;

	customObject.getOutput = (function () {
		var truthTable = ret.getTruthTable();
		var lut = {};
		for (var i = 0; i < truthTable.table.length; i++) {
			var bitstring = 0;
			for (var j = 0; j < truthTable.table[i].length; j++)
				bitstring = (bitstring << 1) | truthTable.table[i][j];
			lut[bitstring >> truthTable.outputLength] = bitstring & ((1 << truthTable.outputLength) - 1); 
		}

		customObject.inputLength = truthTable.inputLength;
		customObject.outputLength = truthTable.outputLength;

		return function (input) {
			var bitInput = 0;
			for (var i = 0; i < customObject.inputLength; i++)
				bitInput = (bitInput << 1) | input[i];
			var bitOutput = lut[bitInput];
			var output = [];
			for (var i = 0; i < customObject.outputLength; i++) {
				output.push(bitOutput & 1);
				bitOutput >>= 1;
			}
			return output;
		};
	})();

	ret.customObjects.push(customObject);
	ret.createCustomGate(customObject.id, true, function (element) {});
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