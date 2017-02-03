var Constants = require("./constants.js");
var Main = require("./main.js");
var fabric = require("fabric-webpack").fabric;
var $ = require("jquery");

// initial gate id counter when building the circuit tree
var initialGateId = 100;
var horizontalStart = 500;
var verticalStart = 0;
var maxDepth = 100;

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
	
	var left = horizontalStart - depth * Constants.OPTS.gridSize * 2;
	var top = verticalStart + depths[depth] * Constants.OPTS.gridSize;

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
		width: Constants.OPTS.gridSize,
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
	
	for (var i = 0; i < maxDepth; i++)
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
			top: verticalStart,
			left: horizontalStart + Constants.OPTS.gridSize,
			state: Constants.STATES.OFF
		};
		Main.wireObjects(oImage.id, map[outputGate].id, generatedObjects, 1);
		callback(generatedObjects);
	}, {
		id: Main.currObjectId++,
		top: verticalStart,
		left: horizontalStart + Constants.OPTS.gridSize,
		height: Constants.OPTS.gridSize,
		width: Constants.OPTS.gridSize,
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

module.exports = ret;