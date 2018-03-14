// Directional lighting demo: By Frederick Li
// Vertex shader program
var VSHADER_SOURCE =
	'attribute vec4 a_Position;\n' +
	'attribute vec4 a_Color;\n' +
	'attribute vec4 a_Normal;\n' + // Normal
	'uniform mat4 u_ModelMatrix;\n' + // No idea
	'uniform mat4 u_NormalMatrix;\n' + // Probably lighting related
	'uniform mat4 u_ViewMatrix;\n' + // View Matrix?? This might be camera direction
	'uniform mat4 u_ProjMatrix;\n' + // Projection Matrix??
	'uniform vec3 u_LightColor;\n' + // Light color
	'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
	'varying vec4 v_Color;\n' +
	'uniform bool u_isLighting;\n' +
	'void main() {\n' +
	'  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
	'  if(u_isLighting)\n' +
	'  {\n' +
	'     vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
	'     float nDotL = max(dot(normal, u_LightDirection), 0.0);\n' +
	// Calculate the color due to diffuse reflection
	'     vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
	'     v_Color = vec4(diffuse, a_Color.a);\n' + '  }\n' +
	'  else\n' +
	'  {\n' +
	'     v_Color = a_Color;\n' +
	'  }\n' +
	'}\n';

// Fragment shader program
var FSHADER_SOURCE =
	'#ifdef GL_ES\n' +
	'precision mediump float;\n' +
	'#endif\n' +
	'varying vec4 v_Color;\n' +
	'void main() {\n' +
	'  gl_FragColor = v_Color;\n' +
	'}\n';

var modelMatrix = new Matrix4(); // The model matrix
var viewMatrix = new Matrix4(); // The view matrix
var projMatrix = new Matrix4(); // The projection matrix
var g_normalMatrix = new Matrix4(); // Coordinate transformation matrix for normals

var ANGLE_STEP = 3.0; // The increments of rotation angle (degrees)
var g_xAngle = 0.0; // The rotation x angle (degrees)
var g_yAngle = 0.0; // The rotation y angle (degrees)

var color_sky = [100, 150, 255]
var color_red = [255,0,0]
var color_wood = [139,90,43]
var color_lwood = [255,165,79]
var color_dgrey = [40,40,40]
var color_lgrey = [150,150,150]
var color_black = [0,0,0]
var color_white = [255,255,255]
var color_navy = [0,0,80]

function main() {
	// Retrieve <canvas> element
	var canvas = document.getElementById('webgl');

	canvas.width = document.body.clientWidth
	canvas.height = document.body.clientHeight

	// Get the rendering context for WebGL
	var gl = getWebGLContext(canvas);
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// Initialize shaders
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('Failed to intialize shaders.');
		return;
	}

	// Set clear color and enable hidden surface removal
	gl.clearColor(0, 0, 0, 0);
	gl.enable(gl.DEPTH_TEST);

	// Clear color and depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Get the storage locations of uniform attributes
	var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
	var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
	var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
	var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
	var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
	var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');

	// Trigger using lighting or not
	var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting');

	if (!(u_ModelMatrix && u_ViewMatrix && u_NormalMatrix && u_ProjMatrix && u_LightColor && u_LightDirection && u_isLighting)) {
		console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
		return;
	}

	// Set the light color (white)
	gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
	// Set the light direction (in the world coordinate)
	var lightDirection = new Vector3([0.5, 3.0, 4.0]);
	lightDirection.normalize(); // Normalize
	gl.uniform3fv(u_LightDirection, lightDirection.elements);

	// Calculate the view matrix and the projection matrix
	viewMatrix.setLookAt(0, 0, 15, 0, 0, -100, 0, 1, 0);
	projMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100);
	// Pass the model, view, and projection matrix to the uniform variable respectively
	gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
	gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

	document.onkeydown = function(ev) {
		keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
	};

	draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {
	switch (ev.keyCode) {
		case 40: // Up arrow key -> the positive rotation of arm1 around the y-axis
			g_xAngle = (g_xAngle + ANGLE_STEP) % 360;
			break;
		case 38: // Down arrow key -> the negative rotation of arm1 around the y-axis
			g_xAngle = (g_xAngle - ANGLE_STEP) % 360;
			break;
		case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
			g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
			break;
		case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
			g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
			break;
		default:
			return; // Skip drawing at no effective action
	}

	// Draw the scene
	draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}

function initVertexBuffers(gl) {
	// Create a cube
	//    v6----- v5
	//   /|      /|
	//  v1------v0|
	//  | |     | |
	//  | |v7---|-|v4
	//  |/      |/
	//  v2------v3
	var vertices = new Float32Array([ // Coordinates
		0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, // v0-v1-v2-v3 front
		0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, // v0-v3-v4-v5 right
		0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
		-0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, // v1-v6-v7-v2 left
		-0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, // v7-v4-v3-v2 down
		0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5 // v4-v7-v6-v5 back
	]);

	var normals = new Float32Array([ // Normal
		0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // v0-v1-v2-v3 front
		1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // v0-v3-v4-v5 right
		0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v5-v6-v1 up
		-1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
		0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // v7-v4-v3-v2 down
		0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0 // v4-v7-v6-v5 back
	]);

	// Indices of the vertices
	var indices = new Uint8Array([
		0, 1, 2, 0, 2, 3, // front
		4, 5, 6, 4, 6, 7, // right
		8, 9, 10, 8, 10, 11, // up
		12, 13, 14, 12, 14, 15, // left
		16, 17, 18, 16, 18, 19, // down
		20, 21, 22, 20, 22, 23 // back
	]);

	// Write the vertex property to buffers (coordinates, colors and normals)
	if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
	if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
	setColors(gl, color_red)

	// Write the indices to the buffer object
	var indexBuffer = gl.createBuffer();
	if (!indexBuffer) {
		console.log('Failed to create the buffer object');
		return false;
	}

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

	return indices.length;
}

function setColors(gl, color){
	var r = color[0]/255
	var g = color[1]/255
	var b = color[2]/255
	
	var colors = new Float32Array([ // Colors
		r, g, b, r, g, b, r, g, b, r, g, b, // v0-v1-v2-v3 front
		r, g, b, r, g, b, r, g, b, r, g, b, // v0-v3-v4-v5 right
		r, g, b, r, g, b, r, g, b, r, g, b, // v0-v5-v6-v1 up
		r, g, b, r, g, b, r, g, b, r, g, b, // v1-v6-v7-v2 left
		r, g, b, r, g, b, r, g, b, r, g, b, // v7-v4-v3-v2 down
		r, g, b, r, g, b, r, g, b, r, g, b, // v4-v7-v6-v5 back
	]);
	if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
}

function initArrayBuffer(gl, attribute, data, num, type) {
	// Create a buffer object
	var buffer = gl.createBuffer();
	if (!buffer) {
		console.log('Failed to create the buffer object');
		return false;
	}
	// Write date into the buffer object
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	// Assign the buffer object to the attribute variable
	var a_attribute = gl.getAttribLocation(gl.program, attribute);
	if (a_attribute < 0) {
		console.log('Failed to get the storage location of ' + attribute);
		return false;
	}
	gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
	// Enable the assignment of the buffer object to the attribute variable
	gl.enableVertexAttribArray(a_attribute);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return true;
}

//delete this?
function initAxesVertexBuffers(gl) {

	var verticesColors = new Float32Array([
		// Vertex coordinates and color (for axes)
		-20.0, 0.0, 0.0, 1.0, 1.0, 1.0, // (x,y,z), (r,g,b) 
		20.0, 0.0, 0.0, 1.0, 1.0, 1.0,
		0.0, 20.0, 0.0, 1.0, 1.0, 1.0,
		0.0, -20.0, 0.0, 1.0, 1.0, 1.0,
		0.0, 0.0, -20.0, 1.0, 1.0, 1.0,
		0.0, 0.0, 20.0, 1.0, 1.0, 1.0
	]);
	var n = 6;

	// Create a buffer object
	var vertexColorBuffer = gl.createBuffer();
	if (!vertexColorBuffer) {
		console.log('Failed to create the buffer object');
		return false;
	}

	// Bind the buffer object to target
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

	var FSIZE = verticesColors.BYTES_PER_ELEMENT;
	//Get the storage location of a_Position, assign and enable buffer
	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if (a_Position < 0) {
		console.log('Failed to get the storage location of a_Position');
		return -1;
	}
	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
	gl.enableVertexAttribArray(a_Position); // Enable the assignment of the buffer object

	// Get the storage location of a_Position, assign buffer and enable
	var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
	if (a_Color < 0) {
		console.log('Failed to get the storage location of a_Color');
		return -1;
	}
	gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
	gl.enableVertexAttribArray(a_Color); // Enable the assignment of the buffer object

	// Unbind the buffer object
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return n;
}

var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
	var m2 = new Matrix4(m);
	g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
	return g_matrixStack.pop();
}

//This does the actual creation of the scene
function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {

	// Clear color and depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Set the vertex coordinates and color (for the x, y axes)

	var n = initAxesVertexBuffers(gl);
	if (n < 0) {
		console.log('Failed to set the vertex information');
		return;
	}

	// Pass the model matrix to the uniform variable
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

	gl.uniform1i(u_isLighting, true); // Will apply lighting

	// Set the vertex coordinates and color (for the cube)
	var n = initVertexBuffers(gl);
	if (n < 0) {
		console.log('Failed to set the vertex information');
		return;
	}

	var ctx = {}
	ctx.gl = gl
	ctx.u_ModelMatrix = u_ModelMatrix
	ctx.u_NormalMatrix = u_NormalMatrix
	ctx.n = n

	// Translate, and then rotate the model
	modelMatrix.setTranslate(0, 0, 0); // Translation (No translation is supported here yet)
	modelMatrix.rotate(10+g_xAngle, 1, 0, 0); // Rotate along x axis
	modelMatrix.rotate(120+g_yAngle, 0, 1, 0); // Rotate along y axis
	//modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
	//modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis

	modelDesksAndChairs(ctx, 0, 0, 0)
}

function modelDesksAndChairs(ctx, x, y, z){
	modelTeacherChairDesk(ctx, x, y, z+6)
	modelChairDeskRows(ctx, x, y, z-6)
}

function modelTeacherChairDesk(ctx, x, y, z){
	modelTeacherChair(ctx, x, y, z)
	modelTeacherDesk(ctx, x, y, z-1)
}

function modelTeacherChair(ctx, x, y, z) {
	addCube(ctx, x, y, z, 1, 0.2, 1, color_lgrey) //seat
	addCube(ctx, x, y+1, z+0.5, 1, 1.3, 0.2, color_lgrey) //back
	addCube(ctx, x, y+0.4, z+0.6, 0.2, 0.9, 0.15, color_dgrey) //connector
	addCube(ctx, x, y-0.5, z, 0.2, 0.9, 0.2, color_dgrey) //wheel connector
	addCubeWithRotate(ctx, x, y-0.95, z, 1.6, 0.2, 0.2, 0, 45, 0, color_dgrey) //one diagonal
	addCubeWithRotate(ctx, x, y-0.95, z, 1.6, 0.2, 0.2, 0, -45, 0, color_dgrey) //one diagonal
	addCubeWithRotate(ctx, x+0.5, y-1.1, z+0.5, 0.15, 0.15, 0.15, 0, 45, 0, color_black) //one wheel
	addCubeWithRotate(ctx, x-0.5, y-1.1, z+0.5, 0.15, 0.15, 0.15, 0, 45, 0, color_black) //one wheel
	addCubeWithRotate(ctx, x+0.5, y-1.1, z-0.5, 0.15, 0.15, 0.15, 0, -45, 0, color_black) //one wheel
	addCubeWithRotate(ctx, x-0.5, y-1.1, z-0.5, 0.15, 0.15, 0.15, 0, -45, 0, color_black) //one wheel
}

function modelTeacherDesk(ctx, x, y, z) {
	addCube(ctx, x, y + 0.75, z, 4, 0.2, 2, color_wood) //chair back
	addCube(ctx, x + 1.4, y-0.2, z, 1, 1.9, 1.8, color_wood) //left side
	addCube(ctx, x - 1.4, y-0.2, z, 1, 1.9, 1.8, color_wood) //right side
}

function modelChairDeskRows(ctx, x, y, z) {
	var arr = [-5.5, -2.75, 0, 2.75, 5.5]
	arr.forEach(function(element) {
		modelChairDeskRow(ctx, x, y, z + element)
	})
}

function modelChairDeskRow(ctx, x, y, z) {
	var arr = [-9.5, -7, -4.5, -2, 2, 4.5, 7, 9.5]
	arr.forEach(function(element) {
		modelChairDesk(ctx, x + element, y, z)
	})
}

function modelChairDesk(ctx, x, y, z) {
	modelChair(ctx, x, y, z)
	modelDesk(ctx, x + 1, y, z + 1)
}

function modelDesk(ctx, x, y, z) {
	addCube(ctx, x - 0.625, y + 1, z, 2, 0.1, 1, color_lwood) //desk top
	addCube(ctx, x + 0.2, y + 0.275, z + 0.375, 0.1, 1.4, 0.1, color_lwood) //front right leg
	addCube(ctx, x - 1.45, y + 0.275, z + 0.375, 0.1, 1.4, 0.1, color_lwood) //front left leg
	addCube(ctx, x + 0.2, y + 0.275, z - 0.375, 0.1, 1.4, 0.1, color_lwood) //back right leg
	addCube(ctx, x - 1.45, y + 0.275, z - 0.375, 0.1, 1.4, 0.1, color_lwood) //back left leg
}

function modelChair(ctx, x, y, z) {
	addCube(ctx, x + 0.375, y + 0.5, z + 0.375, 1, 0.25, 1, color_navy) //chair seat
	addCube(ctx, x + 0.375, y + 1.125, z, 1, 1, 0.25, color_navy) //chair back
	addCube(ctx, x + 0.75, y, z + 0.75, 0.25, 0.75, 0.25, color_wood) //front right leg
	addCube(ctx, x, y, z + 0.75, 0.25, 0.75, 0.25, color_wood) //front left leg
	addCube(ctx, x + 0.75, y, z, 0.25, 0.75, 0.25, color_wood) //back right leg
	addCube(ctx, x, y, z, 0.25, 0.75, 0.25, color_wood) //back left leg
}

function addCube(ctx, x, y, z, sX, sY, sZ, color){
	addCubeWithRotate(ctx, x, y, z, sX, sY, sZ, 0, 0, 0, color);
}

function addCubeWithRotate(ctx, x, y, z, sX, sY, sZ, rX, rY, rZ, color) {
	setColors(ctx.gl, color)
	pushMatrix(modelMatrix);
	modelMatrix.translate(x, y, z); // Translation
	modelMatrix.rotate(rX, 1, 0, 0); //Rotate x
	modelMatrix.rotate(rY, 0, 1, 0); //Rotate y
	modelMatrix.rotate(rZ, 0, 0, 1); //Rotate z
	modelMatrix.scale(sX, sY, sZ); // Scale
	drawbox(ctx.gl, ctx.u_ModelMatrix, ctx.u_NormalMatrix, ctx.n);
	modelMatrix = popMatrix();
}

function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n) {
	pushMatrix(modelMatrix);

	// Pass the model matrix to the uniform variable
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

	// Calculate the normal transformation matrix and pass it to u_NormalMatrix
	g_normalMatrix.setInverseOf(modelMatrix);
	g_normalMatrix.transpose();
	gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

	// Draw the cube
	gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

	modelMatrix = popMatrix();
}