let W = window.innerWidth, H = window.innerHeight;
let last_timestamp = undefined;
let last_update_time = 0;
let canvas, ctx = undefined;
const mat4 = glMatrix.mat4;
let buffers;
let programInfo;
let last_temp;
let wind = 0;
let init_temp = 255;
let temp_dec = 10;
let update_time = 5;

function update_screen(timestamp){
	if(!last_timestamp) last_timestamp = timestamp;
	let timestamp_diff = timestamp - last_timestamp;
	last_timestamp = timestamp;

	let time_since_update = timestamp - last_update_time;;
	let new_update = false;
	//console.log(time_since_update);
	if(time_since_update > Math.max(update_time, 0)){
		new_update = true;
		last_update_time = timestamp;
	}

	if(new_update){
		do_draw();
	}
	
	window.requestAnimationFrame(update_screen);
}

window.onload = function(){
	// Setup Canvas
	canvas = document.getElementById("canvas");
	gl = canvas.getContext("webgl2");

	canvas.width = W;
	canvas.height = H;
	gl.viewport(0, 0, W, H);
		 // Vertex shader program
	
		 const vsSource = `#version 300 es
		 in vec4 aVertexPosition;
		 in vec2 aVertexTex;
	 
		 uniform mat4 uModelViewMatrix;
		 uniform mat4 uProjectionMatrix;
	 
		 out vec2 vVertexTex;
		 void main() {
		 // gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
		 gl_Position = aVertexPosition;
		 vVertexTex = aVertexTex;
		 }
		`;
	 
		const fsSource = `#version 300 es
		precision mediump float;
	 
		in vec2 vVertexTex;
	 
		uniform float uWidth;
		uniform float uHeight;
		uniform sampler2D u_image;
		
		out vec4 oCol;

		vec3 FIRE_COLORS[15] = vec3[](vec3(0.0, 0.0, 0.0),
									vec3(0.160, 0.054, 0.003),
									vec3(0.278, 0.070, 0.015),
									vec3(0.403, 0.070, 0.023),
									vec3(0.529, 0.066, 0.023),
									vec3(0.662, 0.050, 0.019),
									vec3(0.8, 0.023, 0.011),
									vec3(0.929, 0.003, 0.003),
									vec3(1, 0.239, 0.003),
									vec3(1, 0.435, 0.098),
									vec3(1, 0.572, 0.215),
									vec3(1, 0.694, 0.356),
									vec3(1, 0.8, 0.513),
									vec3(1, 0.901, 0.690),
									vec3(1.0, 1.0, 0.878));
		void main() {
		  // representing these values as xyzw as rgba
		  // gl_FragCoord contains xyzw, from the window coordinates.
		  // we need to convert them to color ranges
		
		  // convert x,y,z to range [0,+1]
		  float x = gl_FragCoord.x/uWidth;
		  float y = gl_FragCoord.y/uHeight;
		  // depth is always the same in window coordinates
		  float z = gl_FragCoord.z;
		  // gl_FragColor = vec4(x, y, z, 1.0);
		

		  float col_prop = (texture(u_image, vVertexTex).x / 1.0) * 15.0;
		  int col_index = int(floor(col_prop));
		  int col_index_up = int(ceil(col_prop));
		  float mix_prop = col_prop - floor(col_prop);
		  oCol = mix(vec4(FIRE_COLORS[col_index], 1.0), vec4(FIRE_COLORS[col_index_up], 1.0), mix_prop);
		//   oCol =  texture(u_image, vVertexTex);
		//   oCol = vec4(texture(u_image, vVertexTex).x / 255.0, 0.0, 0.0, 1.0);
		}
		 `;
	 
	 
	 
	 
	   const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
	 
	   programInfo = {
		 program: shaderProgram,
		 attribLocations: {
		   vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
		   vertexTempurature: gl.getAttribLocation(shaderProgram, 'aVertexTempurature'),
		   vertexTex: gl.getAttribLocation(shaderProgram, 'aVertexTex'),
		 },
		 uniformLocations: {
		   projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
		   modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
		   uHeight: gl.getUniformLocation(shaderProgram, 'uHeight'),
		   uWidth: gl.getUniformLocation(shaderProgram, 'uWidth'),
		 },
	   };
	 
	 
	 
	   buffers = initBuffers(gl);
	do_draw();
	// Canvas Click event listener
	canvas.addEventListener("mousedown",function(event){
		let mouseX = event.pageX;
		let mouseY = event.pageY;
		let mouse_button = event.button;
		
		// Handle click

	},false);
   document.onkeypress = function(e){
        e = e || window.event;
		let key_pressed = e.keyCode;
		console.log(key_pressed);
		if(key_pressed == 100){
			wind -= 1;
		}
		if(key_pressed == 97){
			wind += 1;
		}
		if(key_pressed == 115){
			init_temp -= 1;
		}
		if(key_pressed == 119){
			init_temp += 1;
		}
		if(key_pressed == 114){
			temp_dec -= 2;
		}
		if(key_pressed == 102){
			temp_dec += 2;
		}
		if(key_pressed == 122){
			update_time -= 2;
		}
		if(key_pressed == 120){
			update_time += 2;
		}
	}
	window.requestAnimationFrame(update_screen);

}

function do_draw(){

	
		// Set clear color to black, fully opaque
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		// Clear the color buffer with specified clear color
		gl.clear(gl.COLOR_BUFFER_BIT);
	

	
	
	  drawScene(gl, programInfo, buffers);
}

function drawScene(gl, programInfo, buffers) {
	gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
	gl.clearDepth(1.0);                 // Clear everything
	gl.enable(gl.DEPTH_TEST);           // Enable depth testing
	gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
  
	// Clear the canvas before we start drawing on it.
  
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
	// Create a perspective matrix, a special matrix that is
	// used to simulate the distortion of perspective in a camera.
	// Our field of view is 45 degrees, with a width/height
	// ratio that matches the display size of the canvas
	// and we only want to see objects between 0.1 units
	// and 100 units away from the camera.
  
	const fieldOfView = 120 * Math.PI / 180;   // in radians
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	const zNear = 0.1;
	const zFar = 100.0;
	const projectionMatrix = mat4.create();
  
	// note: glmatrix.js always has the first argument
	// as the destination to receive the result.
	mat4.perspective(projectionMatrix,
					 fieldOfView,
					 aspect,
					 zNear,
					 zFar);
  
	// Set the drawing position to the "identity" point, which is
	// the center of the scene.
	const modelViewMatrix = mat4.create();
  
	// Now move the drawing position a bit to where we want to
	// start drawing the square.
  
	mat4.translate(modelViewMatrix,     // destination matrix
				   modelViewMatrix,     // matrix to translate
				   [0.0, 0.0, -0.6]);  // amount to translate
  
	// Tell WebGL how to pull out the positions from the position
	// buffer into the vertexPosition attribute.
	{
	  const numComponents = 2;  // pull out 2 values per iteration
	  const type = gl.FLOAT;    // the data in the buffer is 32bit floats
	  const normalize = false;  // don't normalize
	  const stride = 0;         // how many bytes to get from one set of values to the next
								// 0 = use type and numComponents above
	  const offset = 0;         // how many bytes inside the buffer to start from
	  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
	  gl.vertexAttribPointer(
		  programInfo.attribLocations.vertexPosition,
		  numComponents,
		  type,
		  normalize,
		  stride,
		  offset);
	  gl.enableVertexAttribArray(
		  programInfo.attribLocations.vertexPosition);
	}
	{
	  const numComponents = 2;  // pull out 2 values per iteration
	  const type = gl.FLOAT;    // the data in the buffer is 32bit floats
	  const normalize = false;  // don't normalize
	  const stride = 0;         // how many bytes to get from one set of values to the next
								// 0 = use type and numComponents above
	  const offset = 0;         // how many bytes inside the buffer to start from
	  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.tex);
	  gl.vertexAttribPointer(
		  programInfo.attribLocations.vertexTex,
		  numComponents,
		  type,
		  normalize,
		  stride,
		  offset);
	  gl.enableVertexAttribArray(
		  programInfo.attribLocations.vertexTex);
	}
	{
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
	   
		// Set the parameters so we can render any size image.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	   
		const width = Math.floor(W / 10);
		const height = Math.floor(H / 10);
		// Upload the image into the texture.
		let temps = getNewTemperatures(width, height);
		//gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8UI, W, H, 0, gl.R8UI, gl.UNSIGNED_BYTE, );
		//console.log(Uint8Array.from(temps));
		const level = 0;
		const internalFormat = gl.R8;

		const border = 0;
		const format = gl.RED;
		const type = gl.UNSIGNED_BYTE;
		const data = Uint8Array.from(temps);
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
              format, type, data);
	}
  
	// Tell WebGL to use our program when drawing
  
	gl.useProgram(programInfo.program);
  
	// Set the shader uniforms
  
	gl.uniformMatrix4fv(
		programInfo.uniformLocations.projectionMatrix,
		false,
		projectionMatrix);
	gl.uniformMatrix4fv(
		programInfo.uniformLocations.modelViewMatrix,
		false,
		modelViewMatrix);
	
	
	gl.uniform1f(programInfo.uniformLocations.uHeight, H);
	gl.uniform1f(programInfo.uniformLocations.uWidth, W);
	{
	  const offset = 0;
	  const vertexCount = 4;
	  gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
	}
  }

  function getNewTemperatures(width, height){
	
	let temps = [];
	let unclamped_temps = [];
	for(let y = 0; y < height; y++){
		for(let x = 0; x < width; x++){
			let t = 0;
			if(y == 0){
				t = (Math.floor((y == 0) * init_temp));
			}else if(! last_temp){
				t = (0);
			}else{
				let p_index = (y * Math.ceil(width)) + x;
				let current_temp = last_temp[p_index];
	
				let under_row = y - 1;
				//let under_index = Math.max(Math.min((under_row * Math.ceil(p_row_size)) + Math.min((x + wind), Math.floor(p_row_size)), Math.floor(pixels.length - 1)), 0);
				let flux = wind;
				if(Math.random() < 0.2) flux = Math.floor(Math.random() * 3) - 1
				let under_index = (under_row * width) + ((x + flux) % width);
				let under_temp = last_temp[under_index];
				if(under_index == undefined) under_temp = init_temp;
	
				let new_temperature = Math.max(under_temp - (0.1 + (Math.random() * temp_dec)), 0);
				t = (new_temperature);
			}
			temps.push(Math.min(Math.max(t, 0), 255));
			unclamped_temps.push(t);
		}
	}
	last_temp = unclamped_temps;
	return temps;
  }

  function initBuffers(gl) {

	// Create a buffer for the square's positions.
  
	const positionBuffer = gl.createBuffer();
  
	// Select the positionBuffer as the one to apply buffer
	// operations to from here out.
  
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
	// Now create an array of positions for the square.
  
	const positions = [
	  -1.0,  1.0,
	   1.0,  1.0,
	  -1.0, -1.0,
	   1.0, -1.0,
	];
  
	// Now pass the list of positions into WebGL to build the
	// shape. We do this by creating a Float32Array from the
	// JavaScript array, then use it to fill the current buffer.
  
	gl.bufferData(gl.ARRAY_BUFFER,
				  new Float32Array(positions),
				  gl.STATIC_DRAW);

	const texBuffer = gl.createBuffer();
  
	// Select the texBuffer as the one to apply buffer
	// operations to from here out.
  
	gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
  
	// Now create an array of texs for the square.
  
	const texs = [
	  0.0,  1.0,
	   1.0,  1.0,
	  0.0, 0.0,
	   1.0, 0.0,
	];
  
	// Now pass the list of texs into WebGL to build the
	// shape. We do this by creating a Float32Array from the
	// JavaScript array, then use it to fill the current buffer.
  
	gl.bufferData(gl.ARRAY_BUFFER,
				  new Float32Array(texs),
				  gl.STATIC_DRAW);


	const tempBuffer = gl.createBuffer();
  
	gl.bindBuffer(gl.ARRAY_BUFFER, tempBuffer);
  
	// Now create an array of positions for the square.
  
	const temps = Array(W * H).fill(Math.floor(Math.random() * 255));
	console.log(temps);
  
	// Now pass the list of positions into WebGL to build the
	// shape. We do this by creating a Float32Array from the
	// JavaScript array, then use it to fill the current buffer.
  
	gl.bufferData(gl.ARRAY_BUFFER,
				  new Float32Array(temps),
				  gl.STATIC_DRAW);
  
	return {
	  position: positionBuffer,
	  tex: texBuffer,
	  temperature: tempBuffer,
	};
  }

  	//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  
	// Create the shader program
  
	const shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
  
	// If creating the shader program failed, alert
  
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	  alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
	  return null;
	}
  
	return shaderProgram;
  }
  
  //
  // creates a shader of the given type, uploads the source and
  // compiles it.
  //
  function loadShader(gl, type, source) {
	const shader = gl.createShader(type);
  
	// Send the source to the shader object
  
	gl.shaderSource(shader, source);
  
	// Compile the shader program
  
	gl.compileShader(shader);
  
	// See if it compiled successfully
  
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
	  alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
	  gl.deleteShader(shader);
	  return null;
	}
  
	return shader;
  }