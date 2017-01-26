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