var modelMatrix = new Matrix4(); // The model matrix
var projMatrix = new Matrix4(); // The projection matrix
var viewMatrix = new Matrix4(); // The view matrix
var g_normalMatrix = new Matrix4(); // Coordinate transformation matrix for normals

var color_sky = [100, 150, 255, 1]
var color_red = [255,0,0,1]
var color_wood = [139,90,43,1]
var color_lwood = [255,165,79,1]
var color_dgrey = [40,40,40,1]
var color_lgrey = [150,150,150,1]
var color_black = [0,0,0,1]
var color_white = [255,255,255,1]
var color_navy = [0,0,80,1]
var color_wall = [186,252,217,1]
var color_floor = [190,204,226,1]
var color_ceiling = [183,177,150,1]
var color_glass = [0,100,255,0.5]

var ANGLE_STEP = 0.08
var STEP_AMOUNT = 0.6

var height = 3
var eyePos = new THREE.Vector3(0,height,-10)
var eyeDir = new THREE.Vector3(0, 0, STEP_AMOUNT)

var eyeUp = new THREE.Vector3(0,1,0)
var eyeSide = new THREE.Vector3(1,0,0)

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
	if (!initShaders(gl, document.getElementById("vertex-shader").text, document.getElementById("fragment-shader").text)) {
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
	var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
	var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
	var u_LightColor1 = gl.getUniformLocation(gl.program, 'u_LightColor1');
	var u_LightColor2 = gl.getUniformLocation(gl.program, 'u_LightColor2');
	var u_LightDirection1 = gl.getUniformLocation(gl.program, 'u_LightDirection1');
	var u_LightDirection2 = gl.getUniformLocation(gl.program, 'u_LightDirection2');

	// Trigger using lighting or not
	var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting');

	if (!(u_ModelMatrix && u_NormalMatrix && u_ProjMatrix && u_LightColor1 && u_LightColor2 && u_LightDirection1 && u_LightDirection2 && u_isLighting)) {
		console.log('Failed to Get the storage locations of matrix');
		return;
	}

	// Set the light color (white)
	gl.uniform3f(u_LightColor1, 1, 1, 1);
	// Set the light direction (in the world coordinate)
	var lightDirection1 = new Vector3([0.7, 0.6, -0.2]);
	gl.uniform3fv(u_LightDirection1, lightDirection1.elements);
	
	gl.uniform3f(u_LightColor2, 1, 1, 1);
	var lightDirection2 = new Vector3([-0.2, -0.4, 0.7]);
	gl.uniform3fv(u_LightDirection2, lightDirection2.elements);

	updateViewMatrix(gl)

	// Calculate the view matrix and the projection matrix
	projMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100);
	// Pass the model, view, and projection matrix to the uniform variable respectively
	gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

	document.onkeydown = function(ev) {
		keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
	};

	draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}

function updateViewMatrix(gl){
	var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
	if(!u_ViewMatrix){
		console.log('Failed to Get the storage locations of matrix');
		return;
	}
	//console.log(eyeDir)
	viewMatrix.setLookAt(eyePos.x, eyePos.y, eyePos.z, eyeDir.x + eyePos.x, eyeDir.y + eyePos.y, eyeDir.z + eyePos.z, eyeUp.x, eyeUp.y, eyeUp.z)
	gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
}

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {
	switch (ev.keyCode) {
		case 40: // Up arrow key
			eyeDir.applyAxisAngle(eyeSide, -ANGLE_STEP)
			//eyeUp.crossVectors(eyeDir, eyeSide)
			//Ensure this doesn't go over the top and turn upside down
			//eyeUp.normalize()
			break;
		case 38: // Down arrow key
			eyeDir.applyAxisAngle(eyeSide, ANGLE_STEP)
			//eyeUp.crossVectors(eyeDir, eyeSide)
			//eyeUp.normalize()
			break;
		case 39: // Right arrow key
			eyeDir.applyAxisAngle(eyeUp, -ANGLE_STEP)
			eyeSide.crossVectors(eyeDir, eyeUp)
			eyeSide.normalize()
			break;
		case 37: // Left arrow key
			eyeDir.applyAxisAngle(eyeUp, ANGLE_STEP)
			eyeSide.crossVectors(eyeDir, eyeUp)
			eyeSide.normalize()
			break;
		case 87: // W key
			eyePos.add(eyeDir)
			eyePos.y = height
			break;
		case 83: // S key
			eyePos.sub(eyeDir)
			eyePos.y = height
			break;
		case 65: // A key
			eyePos.add(eyeDir.clone().applyAxisAngle(eyeUp, 1.57076))
			eyePos.y = height
			break;
		case 68: // D key
			eyePos.add(eyeDir.clone().applyAxisAngle(eyeUp, -1.57076))
			eyePos.y = height
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
	var a = color[3]
	
	var colors = new Float32Array([ // Colors
		r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a,// v0-v1-v2-v3 front
		r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a,// v0-v3-v4-v5 right
		r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a,// v0-v5-v6-v1 up
		r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a,// v1-v6-v7-v2 left
		r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a,// v7-v4-v3-v2 down
		r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a,// v4-v7-v6-v5 back
	]);
	if (!initArrayBuffer(gl, 'a_Color', colors, 4, gl.FLOAT)) return -1;
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
	
	updateViewMatrix(gl)

	modelWalls(ctx, 0, 0, 0)
	modelDesksAndChairs(ctx, 0, 0, 0)
}

function modelWalls(ctx, x, y, z){
	addCube(ctx, x, y+2, z+10, 25, 7, 0.2, color_wall) //whiteboard wall
	addCube(ctx, x, y+3, z+9.9, 7, 4, 0.2, color_white) //whiteboard
	addCube(ctx, x, y+1, z+9.7, 7.2, 0.2, 0.6, color_dgrey) //bottom border
	addCube(ctx, x-3.5, y+3, z+9.85, 0.1, 4.2, 0.2, color_dgrey) //right border
	addCube(ctx, x+3.5, y+3, z+9.85, 0.1, 4.2, 0.2, color_dgrey) //left border
	addCube(ctx, x, y+5.05, z+9.85, 7, 0.1, 0.2, color_dgrey) //top border
	
	addCube(ctx, x-11.99, y+1, z+6, 0.2, 6, 2, color_wood) //door wall 1
	addCube(ctx, x-12, y+2, z-2, 0.2, 7, 25, color_wall) //door wall 2
	
	addCube(ctx, x-11.9, y+1, z+7, 0.2, 6, 0.2, color_lwood) //door outer 1
	addCube(ctx, x-11.9, y+4, z+6, 0.2, 0.2, 2.4, color_lwood) //door outer 2
	addCube(ctx, x-11.9, y+1, z+5, 0.2, 6, 0.2, color_lwood) //door outer 3
	addCube(ctx, x-11.8, y+1, z+5.35, 0.15, 0.15, 0.15, color_lgrey) //door handle
	
	addCube(ctx, x+12, y+2, z-10, 0.2, 7, 10, color_wall) //window wall 1
	addCube(ctx, x+12, y+2, z+6, 0.2, 7, 10, color_wall) //window wall 2
	addCube(ctx, x+12, y-1, z-2, 0.2, 2, 7, color_wall) //window wall 3
	addCube(ctx, x+12, y+6, z-2, 0.2, 2, 7, color_wall) //window wall 4
	addCube(ctx, x+12, y+2.5, z-5, 0.4, 5, 0.4, color_wood) //window outer 1
	addCube(ctx, x+12, y+2.5, z+1, 0.4, 5, 0.4, color_wood) //window outer 2
	addCube(ctx, x+12, y+0.2, z-2, 0.4, 0.4, 6, color_wood) //window outer 3
	addCube(ctx, x+12, y+4.8, z-2, 0.4, 0.4, 6, color_wood) //window outer 4
	addCube(ctx, x+12, y+2.5, z-2, 0.2, 0.2, 6, color_wood) //window inner 1
	addCube(ctx, x+12, y+2.5, z-2, 0.2, 5, 0.2, color_wood) //window inner 2
	addCube(ctx, x+12, y+2.5, z-2, 0.1, 5, 6, color_glass) //window glass
	
	addCube(ctx, x, y+2, z-14, 25, 7, 0.2, color_wall) //back wall
	addCube(ctx, x, y+5.6, z-2, 25, 0.2, 25, color_ceiling) //ceiling
	addCube(ctx, x, y-1.3, z-2, 25, 0.2, 25, color_floor) //floor
}

function modelDesksAndChairs(ctx, x, y, z){
	modelTeacherChairDesk(ctx, x, y, z+6)
	modelChairDeskRows(ctx, x, y-1, z-6)
}

function modelTeacherChairDesk(ctx, x, y, z){
	modelTeacherChair(ctx, x, y, z)
	modelTeacherDesk(ctx, x, y, z-1)
}

function modelTeacherChair(ctx, x, y, z) {
	addCube(ctx, x, y, z, 1, 0.2, 1, color_lgrey) //seat
	addCube(ctx, x, y+1, z+0.4, 1, 1.3, 0.2, color_lgrey) //back
	addCube(ctx, x, y+0.4, z+0.5, 0.2, 0.9, 0.15, color_dgrey) //connector
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
	modelDesk(ctx, x + 1, y+0.1, z + 1)
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