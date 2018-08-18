const PARTICLES_COUNT = 200000;

(async function main() {
	// Создаём канвас
	const canvas = document.body.appendChild(document.createElement('canvas'));

	// Инициализируем GL
	const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
	gl.clearColor(0, 0, 0, 1);

	const program = gl.createProgram();

	{
		const shader = gl.createShader(gl.VERTEX_SHADER);
		const vertSourcePromise = fetch('vert.glsl').then(resp => resp.text());
		gl.shaderSource(shader, await vertSourcePromise);
		gl.compileShader(shader);
		console.log(gl.getShaderInfoLog(shader));
		gl.attachShader(program, shader);
	}

	{
		const shader = gl.createShader(gl.FRAGMENT_SHADER);
		const fragSourcePromise = fetch('frag.glsl').then(resp => resp.text());
		gl.shaderSource(shader, await fragSourcePromise);
		gl.compileShader(shader);
		console.log(gl.getShaderInfoLog(shader));
		gl.attachShader(program, shader);
	}

	gl.linkProgram(program);

	// WASM
	// const wasmResponsePromise = fetch('random.wasm');
	const wasmResponsePromise = fetch('physics.wasm');
	const res = await WebAssembly.instantiateStreaming(
		wasmResponsePromise,
		{
			Math,
			conf: { count: PARTICLES_COUNT }
		}
	);
	const wasmExports = res.instance.exports;


	// DOM-события
	{
		const onresize = () => {
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
			gl.viewport(0, 0, canvas.width, canvas.height);
		}
		window.addEventListener('resize', onresize);
		onresize();
	}

	{
		const onclick = (e) => {
			wasmExports.onclick(e.offsetX - canvas.clientWidth / 2, e.offsetY - canvas.clientHeight / 2);
		}
		window.addEventListener('click', onclick);
	}


	// Каждый фрейм
	(function frame(){
		requestAnimationFrame(frame);


		// Подготавливаем программу и атрибуты
		gl.useProgram(program);

		{
			const attribLocation = gl.getAttribLocation(program, 'coord');
			gl.enableVertexAttribArray(attribLocation);
			gl.vertexAttribPointer(
				attribLocation, // index
				2, // size (X and Y)
				gl.FLOAT, // float32 each
				false, // normalized. Has no effect on float
				16, // stride
				0 // start index
			);
		}

		{
			const attribLocation = gl.getAttribLocation(program, 'scale');
			gl.disableVertexAttribArray(attribLocation);
			gl.vertexAttrib2f(attribLocation, 2 / canvas.width, -2 / canvas.height);
		}


		// Заполняем буфер
		/*
		const buffer = new Float32Array(PARTICLES_COUNT * 4);
		for (let i = 0; i < buffer.length; i+= 4) {
			buffer[i + 0] = Math.random() * 100;
			buffer[i + 1] = Math.random() * 100;
			buffer[i + 2] = 0;
			buffer[i + 3] = 0;
		}
		*/

		wasmExports.onframe();
		const buffer = wasmExports.mem.buffer;

		// Рисуем
		gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.POINTS, 0, PARTICLES_COUNT);
	})();

})();
